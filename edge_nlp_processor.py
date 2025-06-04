#!/usr/bin/env python3
"""
Edge NLP Processor for Project Scout
Handles local NLU/NLP processing on Raspberry Pi devices
"""

import json
import logging
import os
import time
from typing import Dict, List, Optional, Any
from datetime import datetime
import requests
import spacy
from transformers import pipeline

class EdgeNLPProcessor:
    def __init__(self, config_path: str = "nlp_config.json"):
        """Initialize the Edge NLP Processor with configuration."""
        self.config_path = config_path
        self.config = self._load_config()
        self.models = {}
        self.logger = self._setup_logging()
        
        if self.config.get("local_processing", {}).get("enabled", False):
            self._initialize_models()
    
    def _load_config(self) -> Dict[str, Any]:
        """Load NLP configuration from JSON file."""
        try:
            with open(self.config_path, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            self.logger.warning(f"Config file {self.config_path} not found, using defaults")
            return self._get_default_config()
        except json.JSONDecodeError as e:
            self.logger.error(f"Invalid JSON in config file: {e}")
            return self._get_default_config()
    
    def _get_default_config(self) -> Dict[str, Any]:
        """Return default configuration if config file is not available."""
        return {
            "local_processing": {
                "enabled": False,
                "fallback_to_cloud": True,
                "confidence_threshold": 0.7
            },
            "processing_tasks": {}
        }
    
    def _setup_logging(self) -> logging.Logger:
        """Setup logging configuration."""
        logger = logging.getLogger("EdgeNLP")
        handler = logging.StreamHandler()
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
        return logger
    
    def _initialize_models(self):
        """Initialize local NLP models based on configuration."""
        models_config = self.config.get("local_processing", {}).get("models", {})
        
        # Initialize spaCy models
        if "ner" in models_config:
            try:
                self.models["spacy"] = spacy.load(models_config["ner"])
                self.logger.info(f"Loaded spaCy model: {models_config['ner']}")
            except OSError:
                self.logger.error(f"Failed to load spaCy model: {models_config['ner']}")
        
        # Initialize transformer models
        try:
            if "sentiment" in models_config:
                self.models["sentiment"] = pipeline(
                    "sentiment-analysis",
                    model="cardiffnlp/twitter-roberta-base-sentiment-latest"
                )
                self.logger.info("Loaded sentiment analysis model")
        except Exception as e:
            self.logger.error(f"Failed to load transformer models: {e}")
    
    def process_customer_feedback(self, text: str) -> Dict[str, Any]:
        """Process customer feedback for sentiment and insights."""
        result = {
            "text": text,
            "timestamp": datetime.now().isoformat(),
            "processing_type": "customer_feedback",
            "sentiment": None,
            "entities": [],
            "confidence": 0.0,
            "processed_locally": False
        }
        
        try:
            # Sentiment analysis
            if "sentiment" in self.models:
                sentiment_result = self.models["sentiment"](text)[0]
                result["sentiment"] = {
                    "label": sentiment_result["label"],
                    "score": sentiment_result["score"]
                }
                result["confidence"] = sentiment_result["score"]
                result["processed_locally"] = True
                self.logger.info(f"Processed sentiment locally: {sentiment_result['label']}")
            
            # Named Entity Recognition
            if "spacy" in self.models:
                doc = self.models["spacy"](text)
                result["entities"] = [
                    {
                        "text": ent.text,
                        "label": ent.label_,
                        "start": ent.start_char,
                        "end": ent.end_char,
                        "confidence": float(ent._.get("confidence", 0.8))
                    }
                    for ent in doc.ents
                ]
                self.logger.info(f"Extracted {len(result['entities'])} entities")
            
        except Exception as e:
            self.logger.error(f"Local processing failed: {e}")
            if self.config.get("local_processing", {}).get("fallback_to_cloud", True):
                result = self._fallback_to_cloud_processing(text, "customer_feedback")
        
        return result
    
    def process_product_mention(self, text: str) -> Dict[str, Any]:
        """Process text to extract product and brand mentions."""
        result = {
            "text": text,
            "timestamp": datetime.now().isoformat(),
            "processing_type": "product_mention",
            "brands": [],
            "products": [],
            "categories": [],
            "confidence": 0.0,
            "processed_locally": False
        }
        
        try:
            if "spacy" in self.models:
                doc = self.models["spacy"](text)
                
                # Extract brands and products
                for ent in doc.ents:
                    if ent.label_ in ["ORG", "PRODUCT"]:
                        entity_data = {
                            "text": ent.text,
                            "type": ent.label_,
                            "confidence": float(ent._.get("confidence", 0.8))
                        }
                        
                        if ent.label_ == "ORG":
                            result["brands"].append(entity_data)
                        elif ent.label_ == "PRODUCT":
                            result["products"].append(entity_data)
                
                result["processed_locally"] = True
                result["confidence"] = 0.8  # Default confidence for spaCy
                self.logger.info(f"Extracted {len(result['brands'])} brands, {len(result['products'])} products")
        
        except Exception as e:
            self.logger.error(f"Product mention processing failed: {e}")
            if self.config.get("local_processing", {}).get("fallback_to_cloud", True):
                result = self._fallback_to_cloud_processing(text, "product_mention")
        
        return result
    
    def process_with_ollama(self, text: str, model: str, prompt_template: str) -> Dict[str, Any]:
        """Process text using local Ollama model."""
        result = {
            "text": text,
            "timestamp": datetime.now().isoformat(),
            "model": model,
            "response": None,
            "confidence": 0.0,
            "processed_locally": False,
            "processing_time": 0.0
        }
        
        start_time = time.time()
        
        try:
            # Format prompt
            prompt = prompt_template.format(text=text)
            
            # Call Ollama API
            response = requests.post(
                "http://localhost:11434/api/generate",
                json={
                    "model": model,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.1,
                        "top_p": 0.9
                    }
                },
                timeout=30
            )
            
            if response.status_code == 200:
                ollama_result = response.json()
                result["response"] = ollama_result.get("response", "").strip()
                result["processed_locally"] = True
                result["confidence"] = 0.8  # Default confidence for local processing
                result["processing_time"] = time.time() - start_time
                
                self.logger.info(f"Ollama processing successful with {model}")
            else:
                raise Exception(f"Ollama API error: {response.status_code}")
        
        except Exception as e:
            self.logger.error(f"Ollama processing failed: {e}")
            result["error"] = str(e)
            result["processing_time"] = time.time() - start_time
        
        return result
    
    def _fallback_to_cloud_processing(self, text: str, task_type: str) -> Dict[str, Any]:
        """Fallback to cloud-based processing when local processing fails."""
        self.logger.info(f"Falling back to cloud processing for {task_type}")
        
        result = {
            "text": text,
            "timestamp": datetime.now().isoformat(),
            "processing_type": task_type,
            "processed_locally": False,
            "fallback_used": True,
            "confidence": 0.0
        }
        
        # This would integrate with your cloud NLP service
        # For now, return a placeholder result
        result["note"] = "Cloud processing not implemented - local processing failed"
        
        return result
    
    def get_system_status(self) -> Dict[str, Any]:
        """Get the current status of the NLP processing system."""
        status = {
            "timestamp": datetime.now().isoformat(),
            "local_processing_enabled": self.config.get("local_processing", {}).get("enabled", False),
            "models_loaded": list(self.models.keys()),
            "ollama_status": self._check_ollama_status(),
            "memory_usage": self._get_memory_usage(),
            "disk_usage": self._get_model_disk_usage()
        }
        
        return status
    
    def _check_ollama_status(self) -> Dict[str, Any]:
        """Check if Ollama service is running and available."""
        try:
            response = requests.get("http://localhost:11434/api/tags", timeout=5)
            if response.status_code == 200:
                models = response.json().get("models", [])
                return {
                    "status": "running",
                    "available_models": [model["name"] for model in models]
                }
            else:
                return {"status": "error", "message": f"HTTP {response.status_code}"}
        except Exception as e:
            return {"status": "offline", "error": str(e)}
    
    def _get_memory_usage(self) -> Dict[str, float]:
        """Get current memory usage statistics."""
        try:
            import psutil
            memory = psutil.virtual_memory()
            return {
                "total_gb": round(memory.total / (1024**3), 2),
                "used_gb": round(memory.used / (1024**3), 2),
                "available_gb": round(memory.available / (1024**3), 2),
                "percent_used": memory.percent
            }
        except ImportError:
            return {"error": "psutil not available"}
    
    def _get_model_disk_usage(self) -> Dict[str, Any]:
        """Get disk usage for NLP models."""
        model_paths = [
            "/home/projectscout/.ollama/models",
            "/home/projectscout/.cache/huggingface",
            "/home/projectscout/.local/lib/python3.*/site-packages/spacy/lang"
        ]
        
        usage = {}
        for path in model_paths:
            try:
                import shutil
                if os.path.exists(path):
                    total, used, free = shutil.disk_usage(path)
                    usage[path] = {
                        "total_gb": round(total / (1024**3), 2),
                        "used_gb": round(used / (1024**3), 2),
                        "free_gb": round(free / (1024**3), 2)
                    }
            except Exception as e:
                usage[path] = {"error": str(e)}
        
        return usage

def main():
    """Main function for testing the NLP processor."""
    processor = EdgeNLPProcessor()
    
    # Test customer feedback processing
    feedback = "I love the new coffee brand! The taste is amazing and the packaging is so clean."
    result = processor.process_customer_feedback(feedback)
    print("Customer Feedback Result:", json.dumps(result, indent=2))
    
    # Test product mention processing
    mention = "Customer bought Marlboro cigarettes and Coca-Cola from the refrigerator."
    result = processor.process_product_mention(mention)
    print("Product Mention Result:", json.dumps(result, indent=2))
    
    # Test Ollama processing (if available)
    if processor._check_ollama_status()["status"] == "running":
        ollama_result = processor.process_with_ollama(
            "Analyze the sentiment of this customer feedback: Great service today!",
            "phi3:mini",
            "Analyze customer sentiment and provide a brief response: {text}"
        )
        print("Ollama Result:", json.dumps(ollama_result, indent=2))
    
    # Print system status
    status = processor.get_system_status()
    print("System Status:", json.dumps(status, indent=2))

if __name__ == "__main__":
    main()