import React, { useState } from 'react';
import { HelpCircle, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface Message {
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      text: "Hi there! I'm ScoutBot. Ask me anything about this dashboard.",
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      text: inputValue.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Add typing indicator
    const typingMessage: Message = {
      text: 'Typing...',
      sender: 'bot',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, typingMessage]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userMessage.text }),
      });

      const data = await response.json();

      // Remove typing indicator and add real response
      setMessages(prev => {
        const withoutTyping = prev.slice(0, -1);
        return [
          ...withoutTyping,
          {
            text: data.answer || 'Sorry, I encountered an error. Please try again.',
            sender: 'bot',
            timestamp: new Date(),
          },
        ];
      });
    } catch (error) {
      // Remove typing indicator and add error message
      setMessages(prev => {
        const withoutTyping = prev.slice(0, -1);
        return [
          ...withoutTyping,
          {
            text: 'Sorry, something went wrong. Please try again later.',
            sender: 'bot',
            timestamp: new Date(),
          },
        ];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating help button */}
      <div
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-all duration-200 hover:bg-blue-700 hover:shadow-xl"
        onClick={() => setIsOpen(true)}
        title="Need help? Chat with ScoutBot"
      >
        <HelpCircle className="h-6 w-6" />
      </div>

      {/* Chat modal */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80 max-w-sm">
          <Card className="shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between bg-blue-600 py-3 text-white">
              <div>
                <h3 className="text-sm font-semibold">Ask ScoutBot</h3>
                <p className="text-xs opacity-90">Your dashboard assistant</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-white hover:bg-blue-700"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {/* Messages area */}
              <div className="h-64 space-y-3 overflow-y-auto p-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs rounded-lg px-3 py-2 text-sm ${
                        message.sender === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      {message.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Input area */}
              <div className="border-t p-3">
                <div className="flex space-x-2">
                  <Input
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a question..."
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!inputValue.trim() || isLoading}
                    size="sm"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Ask about dashboard features, data insights, or navigation help
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
