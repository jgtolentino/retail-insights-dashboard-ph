"""
Azure OpenAI LLM Adapter with Intelligent Routing
Provides consistent interface for Azure OpenAI with complexity-based model selection
"""

import os
import json
import logging
from typing import Dict, List, Optional, Union
from enum import Enum
import backoff
from openai import AzureOpenAI

logger = logging.getLogger(__name__)

class ComplexityLevel(Enum):
    SIMPLE = "simple"
    MEDIUM = "medium" 
    COMPLEX = "complex"

class ModelConfig:
    def __init__(self, deployment: str, temperature: float, max_tokens: int, cost_per_token: float):
        self.deployment = deployment
        self.temperature = temperature
        self.max_tokens = max_tokens
        self.cost_per_token = cost_per_token

class TaskComplexity:
    def __init__(self, level: ComplexityLevel, confidence: float, reasoning: str, suggested_model: str, temperature: float, max_tokens: int):
        self.level = level
        self.confidence = confidence
        self.reasoning = reasoning
        self.suggested_model = suggested_model
        self.temperature = temperature
        self.max_tokens = max_tokens

class AzureOpenAIAdapter:
    """
    Azure OpenAI adapter with intelligent model routing based on task complexity
    """
    
    def __init__(self):
        # Initialize Azure OpenAI client
        self.client = AzureOpenAI(
            azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
            api_key=os.getenv("AZURE_OPENAI_API_KEY"),
            api_version=os.getenv("AZURE_OPENAI_API_VERSION", "2024-02-15-preview")
        )
        
        # Model configurations by complexity
        self.models = {
            ComplexityLevel.SIMPLE: ModelConfig(
                deployment="gpt-35-turbo",
                temperature=0.1,
                max_tokens=300,
                cost_per_token=0.0005
            ),
            ComplexityLevel.MEDIUM: ModelConfig(
                deployment="gpt-35-turbo-16k",
                temperature=0.3,
                max_tokens=800,
                cost_per_token=0.001
            ),
            ComplexityLevel.COMPLEX: ModelConfig(
                deployment="gpt-4",
                temperature=0.2,
                max_tokens=1500,
                cost_per_token=0.03
            )
        }
    
    def analyze_complexity(self, query: str) -> TaskComplexity:
        """
        Analyze query complexity using pattern matching and heuristics
        """
        clean_query = query.lower().strip()
        word_count = len(clean_query.split())
        char_count = len(clean_query)
        
        # Simple patterns (use GPT-3.5-turbo)
        simple_patterns = [
            r"^(what|show|list|get|find)\s+(top|best|worst)\s+\d+",
            r"^(what|show)\s+(is|are)\s+the\s+\w+",
            r"^count\s+\w+",
            r"^(sum|total|average|mean)\s+\w+",
            r"^simple\s+",
            r"^\w+\s*[+\-*/]\s*\w+$",
        ]
        
        # Complex patterns (use GPT-4)
        complex_patterns = [
            r"(analyze|analysis|compare|comparison|correlation)",
            r"(trend|pattern|insight|recommendation|strategy)",
            r"(why|how|explain|because|reason|factor)",
            r"(predict|forecast|projection|future)",
            r"(segment|cluster|group|categorize)",
            r"(anomaly|outlier|unusual|strange)",
            r"(optimization|optimize|improve|enhance)",
            r"\b(versus|vs|against|compared to)\b",
        ]
        
        # SQL generation complexity indicators
        sql_complexity_indicators = [
            r"(join|group by|having|window|partition)",
            r"(subquery|nested|complex)",
            r"(multiple|several|various|different)",
        ]
        
        import re
        
        # Check for simple patterns first
        for pattern in simple_patterns:
            if re.search(pattern, clean_query, re.IGNORECASE):
                return TaskComplexity(
                    level=ComplexityLevel.SIMPLE,
                    confidence=0.9,
                    reasoning="Matches simple query pattern",
                    suggested_model=self.models[ComplexityLevel.SIMPLE].deployment,
                    temperature=self.models[ComplexityLevel.SIMPLE].temperature,
                    max_tokens=self.models[ComplexityLevel.SIMPLE].max_tokens
                )
        
        # Check for complex patterns
        for pattern in complex_patterns:
            if re.search(pattern, clean_query, re.IGNORECASE):
                return TaskComplexity(
                    level=ComplexityLevel.COMPLEX,
                    confidence=0.85,
                    reasoning="Matches complex analysis pattern",
                    suggested_model=self.models[ComplexityLevel.COMPLEX].deployment,
                    temperature=self.models[ComplexityLevel.COMPLEX].temperature,
                    max_tokens=self.models[ComplexityLevel.COMPLEX].max_tokens
                )
        
        # Check SQL complexity
        for pattern in sql_complexity_indicators:
            if re.search(pattern, clean_query, re.IGNORECASE):
                return TaskComplexity(
                    level=ComplexityLevel.COMPLEX,
                    confidence=0.8,
                    reasoning="Requires complex SQL generation",
                    suggested_model=self.models[ComplexityLevel.COMPLEX].deployment,
                    temperature=self.models[ComplexityLevel.COMPLEX].temperature,
                    max_tokens=self.models[ComplexityLevel.COMPLEX].max_tokens
                )
        
        # Heuristic-based classification
        complexity_score = 0
        
        # Length indicators
        if word_count > 20:
            complexity_score += 2
        elif word_count > 10:
            complexity_score += 1
        
        if char_count > 100:
            complexity_score += 1
        
        # Question type indicators
        if "?" in clean_query:
            question_words = ["why", "how", "what if", "explain"]
            if any(word in clean_query for word in question_words):
                complexity_score += 2
        
        # Multiple criteria
        criteria_words = ["and", "or", "but", "also", "additionally", "furthermore"]
        if any(word in clean_query for word in criteria_words):
            complexity_score += 1
        
        # Time-based analysis
        time_words = ["trend", "over time", "historical", "monthly", "yearly", "seasonal"]
        if any(word in clean_query for word in time_words):
            complexity_score += 1
        
        # Determine final complexity
        if complexity_score <= 1:
            level = ComplexityLevel.SIMPLE
            confidence = 0.7
        elif complexity_score <= 3:
            level = ComplexityLevel.MEDIUM
            confidence = 0.6
        else:
            level = ComplexityLevel.COMPLEX
            confidence = 0.8
        
        return TaskComplexity(
            level=level,
            confidence=confidence,
            reasoning=f"Complexity score: {complexity_score}",
            suggested_model=self.models[level].deployment,
            temperature=self.models[level].temperature,
            max_tokens=self.models[level].max_tokens
        )
    
    @backoff.on_exception(
        backoff.expo,
        Exception,
        max_tries=3,
        max_time=60
    )
    def chat(
        self,
        messages: List[Dict[str, str]],
        query: Optional[str] = None,
        force_model: Optional[str] = None,
        **kwargs
    ) -> Dict:
        """
        Send chat completion request with intelligent routing
        
        Args:
            messages: List of message dicts with 'role' and 'content'
            query: Optional query for complexity analysis (uses first user message if not provided)
            force_model: Optional model to force (bypasses intelligent routing)
            **kwargs: Additional arguments passed to the API
        
        Returns:
            Dict with response, complexity info, and cost estimation
        """
        # Determine query for complexity analysis
        if not query:
            user_messages = [msg['content'] for msg in messages if msg.get('role') == 'user']
            query = user_messages[-1] if user_messages else ""
        
        # Analyze complexity or use forced model
        if force_model:
            model_config = None
            for level, config in self.models.items():
                if config.deployment == force_model:
                    model_config = config
                    break
            if not model_config:
                model_config = self.models[ComplexityLevel.MEDIUM]
            
            complexity = TaskComplexity(
                level=ComplexityLevel.MEDIUM,
                confidence=1.0,
                reasoning="Forced model selection",
                suggested_model=force_model,
                temperature=model_config.temperature,
                max_tokens=model_config.max_tokens
            )
        else:
            complexity = self.analyze_complexity(query)
        
        model_config = self.models[complexity.level]
        
        # Prepare API call parameters
        api_params = {
            "model": complexity.suggested_model,
            "messages": messages,
            "temperature": kwargs.get("temperature", complexity.temperature),
            "max_tokens": kwargs.get("max_tokens", complexity.max_tokens),
            **{k: v for k, v in kwargs.items() if k not in ["temperature", "max_tokens"]}
        }
        
        logger.info(f"🎯 Routing to {complexity.level.value} model: {complexity.suggested_model}")
        logger.info(f"📊 Confidence: {complexity.confidence}, Reasoning: {complexity.reasoning}")
        
        try:
            response = self.client.chat.completions.create(**api_params)
            
            # Calculate estimated cost
            total_tokens = response.usage.total_tokens if response.usage else 0
            estimated_cost = total_tokens * model_config.cost_per_token
            
            return {
                "response": response.choices[0].message.content,
                "complexity": {
                    "level": complexity.level.value,
                    "confidence": complexity.confidence,
                    "reasoning": complexity.reasoning,
                    "suggested_model": complexity.suggested_model
                },
                "estimated_cost": estimated_cost,
                "usage": response.usage.model_dump() if response.usage else None,
                "model_used": complexity.suggested_model
            }
            
        except Exception as error:
            logger.error(f"Error with {complexity.suggested_model}, falling back to simple model: {error}")
            
            # Fallback to simple model
            fallback_config = self.models[ComplexityLevel.SIMPLE]
            fallback_params = {
                **api_params,
                "model": fallback_config.deployment,
                "temperature": fallback_config.temperature,
                "max_tokens": fallback_config.max_tokens
            }
            
            fallback_response = self.client.chat.completions.create(**fallback_params)
            fallback_tokens = fallback_response.usage.total_tokens if fallback_response.usage else 0
            fallback_cost = fallback_tokens * fallback_config.cost_per_token
            
            return {
                "response": fallback_response.choices[0].message.content,
                "complexity": {
                    "level": ComplexityLevel.SIMPLE.value,
                    "confidence": 0.5,
                    "reasoning": "Fallback after error",
                    "suggested_model": fallback_config.deployment
                },
                "estimated_cost": fallback_cost,
                "usage": fallback_response.usage.model_dump() if fallback_response.usage else None,
                "model_used": fallback_config.deployment,
                "fallback_reason": str(error)
            }
    
    def get_model_stats(self) -> Dict:
        """Get current model configuration stats"""
        return {
            level.value: {
                "deployment": config.deployment,
                "temperature": config.temperature,
                "max_tokens": config.max_tokens,
                "cost_per_token": config.cost_per_token
            }
            for level, config in self.models.items()
        }

# Create singleton instance
azure_openai_adapter = AzureOpenAIAdapter()

# Convenience functions for backward compatibility
def chat(messages: List[Dict[str, str]], **kwargs) -> str:
    """Simple chat function that returns just the response text"""
    result = azure_openai_adapter.chat(messages, **kwargs)
    return result["response"]

def chat_with_analysis(messages: List[Dict[str, str]], **kwargs) -> Dict:
    """Chat function that returns full analysis including complexity and cost"""
    return azure_openai_adapter.chat(messages, **kwargs)