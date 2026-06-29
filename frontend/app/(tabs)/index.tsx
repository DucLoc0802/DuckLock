import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Button, FlatList, Text, TextInput, View } from 'react-native';
import { styles } from './index.styles';
import { SafeAreaView } from 'react-native-safe-area-context';
export default function HomeScreen() {
  const [enteredGoalText, setEnteredGoalText] = useState('');


  const [courseGoals, setCourseGoals] = useState<{ text: string; id: string }[]>([]);

  const goalInputHandler = (enteredText: string) => {
    setEnteredGoalText(enteredText);
  };

  const onAddGoal = () => {
    if (enteredGoalText.trim() === '') return;

    setCourseGoals((currentCourseGoals) => [
      ...currentCourseGoals,
      { text: enteredGoalText, id: Math.random().toString() },
    ]);

    setEnteredGoalText('');
  };

  return (
    <LinearGradient colors={['#1e1e1e', '#2e2e2e']}>
      <View style={styles.appContainer}>

        {/* Khu vực nhập dữ liệu */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Mục tiêu học tập của bạn..."
            onChangeText={goalInputHandler}
            value={enteredGoalText}
          />
          <Button onPress={onAddGoal} title="Thêm" />
        </View>

        {/* Khu vực hiển thị danh sách (Thay thế cho <ul> <li>) */}
        <View style={styles.goalsContainer}>
          <FlatList data={courseGoals} alwaysBounceHorizontal={false} renderItem={(itemData) => {
            return (
              <View key={itemData.item.id} style={styles.goalItem}>
                <Text style={styles.goalText}>{itemData.item.text}</Text>
              </View>
            );
          }}
            keyExtractor={(item, index) => item.id}
          />
        </View>
      </View>
    </LinearGradient>
  );
}