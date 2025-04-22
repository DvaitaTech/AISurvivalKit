import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { availableModels, downloadModel, ModelInfo } from '../utils/modelUtils';

interface ModelDownloaderProps {
  onModelDownloaded: (modelPath: string) => void;
  darkMode?: boolean;
}

const ModelDownloader: React.FC<ModelDownloaderProps> = ({
  onModelDownloaded,
  darkMode = false,
}) => {
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});
  const [currentlyDownloading, setCurrentlyDownloading] = useState<string | null>(null);

  const textColor = darkMode ? '#FFFFFF' : '#000000';
  const backgroundColor = darkMode ? '#121212' : '#FFFFFF';
  const buttonColor = darkMode ? '#2196F3' : '#2196F3';

  // Handle model download
  const handleDownload = async (model: ModelInfo) => {
    if (currentlyDownloading) {
      Alert.alert('Download in Progress', 'Please wait for the current download to finish.');
      return;
    }

    try {
      // Show confirmation dialog with model size info
      Alert.alert(
        'Download Model',
        `You are about to download ${model.name} (${model.size}). This may take some time depending on your connection speed. The app will notify you when the download is complete.\n\nDo you want to continue?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Download',
            onPress: async () => {
              try {
                setCurrentlyDownloading(model.localPath);
                setDownloadProgress({ ...downloadProgress, [model.localPath]: 0 });
                
                // Start download with progress tracking
                const modelPath = await downloadModel(model, (progress) => {
                  setDownloadProgress(prev => ({ ...prev, [model.localPath]: progress }));
                });
                
                // Download complete
                Alert.alert(
                  'Download Complete',
                  `The model ${model.name} has been downloaded successfully.`,
                  [{ 
                    text: 'OK',
                    onPress: () => {
                      // Notify parent component AFTER user acknowledges
                      onModelDownloaded(modelPath);
                      setModalVisible(false);
                    }
                  }]
                );
              } catch (error) {
                Alert.alert(
                  'Download Failed',
                  `Failed to download model: ${error instanceof Error ? error.message : 'Unknown error'}`
                );
              } finally {
                setCurrentlyDownloading(null);
              }
            }
          }
        ],
        { cancelable: false }
      );
    } catch (error) {
      console.error('Error in download process:', error);
      setCurrentlyDownloading(null);
    }
  };

  // Render model item
  const renderModelItem = ({ item }: { item: ModelInfo }) => {
    const isDownloading = currentlyDownloading === item.localPath;
    const progress = downloadProgress[item.localPath] || 0;
    
    return (
      <View style={[styles.modelItem, { backgroundColor: darkMode ? '#1E1E1E' : '#F5F5F5' }]}>
        <View style={styles.modelInfo}>
          <Text style={[styles.modelName, { color: textColor }]}>{item.name}</Text>
          <Text style={[styles.modelSize, { color: textColor }]}>Size: {item.size}</Text>
        </View>
        
        {isDownloading ? (
          <View style={styles.progressContainer}>
            <ActivityIndicator size="small" color={buttonColor} />
            <Text style={[styles.progressText, { color: textColor }]}>
              {Math.round(progress * 100)}%
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.downloadButton, { backgroundColor: buttonColor }]}
            onPress={() => handleDownload(item)}
          >
            <Text style={styles.downloadButtonText}>Download</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View>
      <TouchableOpacity
        style={[styles.mainButton, { backgroundColor: buttonColor }]}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.mainButtonText}>Download Models</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalContent, { backgroundColor }]}>
            <Text style={[styles.modalTitle, { color: textColor }]}>Available Models</Text>
            
            <FlatList
              data={availableModels}
              renderItem={renderModelItem}
              keyExtractor={(item) => item.localPath}
              style={styles.modelList}
            />
            
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: buttonColor }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  mainButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
  },
  mainButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  modelList: {
    width: '100%',
  },
  modelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  modelInfo: {
    flex: 1,
  },
  modelName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modelSize: {
    fontSize: 14,
  },
  downloadButton: {
    padding: 8,
    borderRadius: 6,
    minWidth: 100,
    alignItems: 'center',
  },
  downloadButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 100,
    justifyContent: 'flex-end',
  },
  progressText: {
    marginLeft: 8,
    fontSize: 14,
  },
  closeButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    width: '100%',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default ModelDownloader; 