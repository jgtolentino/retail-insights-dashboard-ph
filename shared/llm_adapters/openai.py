"""OpenAI LLM Adapter for AI-Agency platform"""

import os
import openai
from typing import List, Dict, Any, Optional
from dataclasses import dataclass


@dataclass
class ChatMessage:
    role: str
    content: str


@dataclass
class LLMResponse:
    content: str
    tokens_used: int
    model: str
    cost_estimate: float


class OpenAIAdapter:
    """Adapter for OpenAI GPT models"""
    
    def __init__(self, api_key: Optional[str] = None, model: str = "gpt-4"):
        self.client = openai.OpenAI(
            api_key=api_key or os.getenv("OPENAI_API_KEY")
        )
        self.model = model
        
    def chat(
        self, 
        messages: List[ChatMessage], 
        temperature: float = 0.7,
        max_tokens: Optional[int] = None
    ) -> LLMResponse:
        """Send chat completion request"""
        
        formatted_messages = [
            {"role": msg.role, "content": msg.content} 
            for msg in messages
        ]
        
        response = self.client.chat.completions.create(
            model=self.model,
            messages=formatted_messages,
            temperature=temperature,
            max_tokens=max_tokens
        )
        
        return LLMResponse(
            content=response.choices[0].message.content,
            tokens_used=response.usage.total_tokens,
            model=self.model,
            cost_estimate=self._estimate_cost(response.usage.total_tokens)
        )
    
    def embed(self, text: str) -> List[float]:
        """Generate embeddings for text"""
        response = self.client.embeddings.create(
            model="text-embedding-ada-002",
            input=text
        )
        return response.data[0].embedding
    
    def _estimate_cost(self, tokens: int) -> float:
        """Rough cost estimation based on model"""
        costs_per_1k = {
            "gpt-4": 0.03,
            "gpt-4-turbo": 0.01,
            "gpt-3.5-turbo": 0.002
        }
        rate = costs_per_1k.get(self.model, 0.01)
        return (tokens / 1000) * rate


class AzureOpenAIAdapter(OpenAIAdapter):
    """Adapter for Azure OpenAI Service"""
    
    def __init__(
        self, 
        endpoint: Optional[str] = None,
        api_key: Optional[str] = None,
        api_version: str = "2024-02-15-preview",
        deployment_name: str = "gpt-4"
    ):
        self.client = openai.AzureOpenAI(
            azure_endpoint=endpoint or os.getenv("AZURE_OPENAI_ENDPOINT"),
            api_key=api_key or os.getenv("AZURE_OPENAI_API_KEY"),
            api_version=api_version
        )
        self.model = deployment_name


# Factory function for easy instantiation
def create_llm_adapter(provider: str = "openai", **kwargs) -> OpenAIAdapter:
    """Factory function to create appropriate LLM adapter"""
    if provider == "openai":
        return OpenAIAdapter(**kwargs)
    elif provider == "azure":
        return AzureOpenAIAdapter(**kwargs)
    else:
        raise ValueError(f"Unsupported provider: {provider}")