import { StyleSheet } from 'react-native';

export const minimalStyles = StyleSheet.create({
  contentWrapper: {
    marginBottom: 10,
  },
  captionInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    minHeight: 80,
    textAlignVertical: 'top',
    backgroundColor: '#fff',
  },
  uploadButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  uploadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e9ecef',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  uploadButtonText: {
    marginLeft: 5,
    fontSize: 16,
    color: '#007bff',
  },
  errorText: {
    marginTop: 10,
    color: 'red',
    fontSize: 14,
    textAlign: 'center',
  },
});

export const modalStyles = StyleSheet.create({
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#007bff',
  },
});
