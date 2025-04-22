import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Text,
} from 'react-native';
import { GiftedChat, IMessage } from 'react-native-gifted-chat';
import LlamaService from '../services/LlamaService';

interface AIChatProps {
  modelPath?: string;
  welcomeMessage?: string;
  darkMode?: boolean;
}

const AIChat: React.FC<AIChatProps> = ({
  modelPath,
  welcomeMessage = 'Hello! I am your AI assistant. How can I help you today?',
  darkMode = false,
}) => {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [initError, setInitError] = useState<string | null>(null);

  // Initialize the LLaMA model
  useEffect(() => {
    async function initLlama() {
      try {
        setIsInitialized(false);
        const success = await LlamaService.init({
          modelPath: modelPath,
        });
        
        if (success) {
          setIsInitialized(true);
          setInitError(null);
          
          // Add welcome message
          setMessages([{
            _id: 1,
            text: welcomeMessage,
            createdAt: new Date(),
            user: {
              _id: 2,
              name: 'AI Assistant',
              avatar: 'https://placeimg.com/140/140/tech',
            },
          }]);
        } else {
          setInitError('Failed to initialize the AI model');
        }
      } catch (error) {
        console.error('Error initializing model:', error);
        setInitError(error instanceof Error ? error.message : 'Unknown error');
      }
    }

    initLlama();

    // Cleanup when component unmounts
    return () => {
      LlamaService.cleanup();
    };
  }, [modelPath, welcomeMessage]);

  // Handle sending messages
  const onSend = useCallback(async (newMessages: IMessage[] = []) => {
    if (newMessages.length === 0) return;

    // Add user message to chat
    setMessages(previousMessages => 
      GiftedChat.append(previousMessages, newMessages)
    );

    // Get the text of the latest message
    const userMessage = newMessages[0].text;
    
    // Set processing state
    setIsProcessing(true);
    
    try {
      // Get AI response
      const response = await LlamaService.generateResponse(userMessage);
      
      // Add AI response to chat
      const aiMessage: IMessage = {
        _id: Math.random().toString(36).substring(7),
        text: response.trim(),
        createdAt: new Date(),
        user: {
          _id: 2,
          name: 'AI Assistant',
          avatar: 'https://placeimg.com/140/140/tech',
        },
      };
      
      setMessages(previousMessages => 
        GiftedChat.append(previousMessages, [aiMessage])
      );
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      // Add error message
      const errorMessage: IMessage = {
        _id: Math.random().toString(36).substring(7),
        text: 'Sorry, I encountered an error while processing your request.',
        createdAt: new Date(),
        user: {
          _id: 2,
          name: 'AI Assistant',
          avatar: 'https://placeimg.com/140/140/tech',
        },
      };
      
      setMessages(previousMessages => 
        GiftedChat.append(previousMessages, [errorMessage])
      );
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Render loading indicator when initializing or processing
  const renderFooter = useCallback(() => {
    if (!isInitialized) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6646ee" />
        </View>
      );
    }
    
    if (isProcessing) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#6646ee" />
        </View>
      );
    }
    
    if (initError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{initError}</Text>
        </View>
      );
    }
    
    return null;
  }, [isInitialized, isProcessing, initError]);

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
        <GiftedChat
          messages={messages}
          onSend={messages => onSend(messages)}
          user={{
            _id: 1,
          }}
          renderFooter={renderFooter}
          renderUsernameOnMessage
          alwaysShowSend
          inverted
          renderAvatarOnTop
          showUserAvatar
          isTyping={isProcessing}
        />
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  loadingContainer: {
    padding: 10,
    alignItems: 'center',
  },
  errorContainer: {
    padding: 10,
    backgroundColor: '#ffeeee',
    borderRadius: 5,
    margin: 10,
  },
  errorText: {
    color: '#ff0000',
  }
});

export default AIChat; 