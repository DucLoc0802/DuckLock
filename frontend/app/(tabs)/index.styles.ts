import { StyleSheet, ImageBackground } from 'react-native';

export const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc',
    paddingBottom: 24,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#cccccc',
    width: '70%',
    marginRight: 8,
    padding: 8,
  },
  goalsContainer: {
    flex: 5,
  },

  // Thêm vào trong StyleSheet.create của file index.styles.ts nhé:
  goalItem: {
    margin: 8,
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#5e0acc',
    overflow: 'hidden', // <--- Thêm dòng này để ép iOS phải bo góc
  },
  goalText: {
    color: 'white',
  },
});
