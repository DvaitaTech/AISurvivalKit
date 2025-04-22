/**
 * AI Survival Kit - LLaMA.rn Chat App
 * https://github.com/SevaSk/eplichaAI
 */

import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  useColorScheme,
  View,
  Text,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import AIChat from './src/components/AIChat';
import ModelDownloader from './src/components/ModelDownloader';
import { getLocalModels, getModelPath, availableModels } from './src/utils/modelUtils';

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [modelPath, setModelPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
    flex: 1,
  };

  // Check for available models on app startup
  useEffect(() => {
    async function checkModels() {
      try {
        setIsLoading(true);
        const localModels = await getLocalModels();
        
        if (localModels.length > 0) {
          // Use the first available model
          const modelFile = localModels[0];
          setModelPath(getModelPath(modelFile));
          console.log(`Using model: ${modelFile}`);
        } else {
          // No models available, show error
          setError('No language models found. Please add a model to the models directory.');
          Alert.alert(
            'No Models Found',
            'No language models were found on your device. Please download a model first.',
            [{ text: 'OK' }]
          );
        }
      } catch (err) {
        setError('Failed to check for models');
        console.error('Error checking models:', err);
      } finally {
        setIsLoading(false);
      }
    }

    checkModels();
  }, []);

  // Render loading state
  if (isLoading) {
    return (
      <SafeAreaView style={[backgroundStyle, styles.centerContainer]}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={backgroundStyle.backgroundColor}
        />
        <ActivityIndicator size="large" color="#6646ee" />
        <Text style={[styles.loadingText, { color: isDarkMode ? Colors.light : Colors.dark }]}>
          Checking for language models...
        </Text>
      </SafeAreaView>
    );
  }

  // Render error state
  if (error) {
    return (
      <SafeAreaView style={[backgroundStyle, styles.centerContainer]}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={backgroundStyle.backgroundColor}
        />
        <Text style={[styles.errorText, { color: isDarkMode ? Colors.light : Colors.dark }]}>
          {error}
        </Text>
        <ModelDownloader 
          onModelDownloaded={(path) => {
            setModelPath(path);
            setError(null);
          }}
          darkMode={isDarkMode}
        />
      </SafeAreaView>
    );
  }

  // Render chat interface with available model
  return (
    <SafeAreaView style={backgroundStyle}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      {modelPath ? (
        <AIChat 
          modelPath={modelPath}
          welcomeMessage="Hello! I am your AI assistant powered by llama.rn. How can I help you today?"
          darkMode={isDarkMode}
        />
      ) : (
        <View style={styles.centerContainer}>
          <Text style={[styles.errorText, { color: isDarkMode ? Colors.light : Colors.dark }]}>
            Please add a language model to use the chat.
          </Text>
          <ModelDownloader 
            onModelDownloaded={(path) => {
              setModelPath(path);
            }}
            darkMode={isDarkMode}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#ff0000',
  },
});

export default App;
