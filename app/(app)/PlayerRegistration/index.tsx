
import { supabase } from '@utils/superbase'; 
import { View, Text, TextInput, Button,ScrollView, StyleSheet,Pressable,Platform, Alert } from 'react-native';
import * as Yup from 'yup';
import { Formik } from 'formik';
import DateTimePicker from '@react-native-community/datetimepicker';
import RNPickerSelect from 'react-native-picker-select';
import React, { useState } from 'react';
import { TouchableOpacity } from 'react-native';


interface PlayerValues {
  FirstName: string;
  LastName: string;
  age: string; // 
  position: string;
  Dob: Date;
  Team: string;
  gender:string;
}
const PlayerRegistrationSchema=Yup.object().shape({
    FirstName:Yup.string().required('First names required'),
    LastName:Yup.string().required('Last name required'),
    age:Yup.number().required('players age required'),
    position:Yup.string().required('players position is empty'),
    Dob:Yup.date().required('Date of birth required').max(new Date(),'Date of birth cannot be in the future'),
    Team:Yup.string().required('Team name is required'),
    gender:Yup.string().required('player name is required')
});

const positionOptions = [
  { label: 'Goaltender', value: 'Goaltender' },
  { label: 'Center', value: 'Center' },
  { label: 'Right Winger', value: 'Right Winger' },
  { label: 'Left Winger', value: 'Left Winger' },
  { label: 'Right Defenseman', value: 'Right Defenseman' },
  { label: 'Left Defenseman', value: 'Left Defenseman' },
];

const genderOptions=[
  {label:'Male',value:'Male'},
  {label:'Female',value:'Female'},
  {label:'Other',value:'Other'},
  

]


export default function PlayerScreen() {

    const [showDatePicker, setShowDatePicker] = useState(false);
     const [values, setValues] = useState({ Dob: null })    

 const registerPlayer = async  (values: PlayerValues, resetForm: () => void) => {
  try {
    const { data, error } = await supabase.from('players').insert([values]);
    if (error) {
      console.error(error);
      Alert.alert('Error', `Failed to register player: ${error.message}`);
    } else {
      Alert.alert('Success', 'Player registered successfully');
      resetForm();
    }
  } catch (err) {
    console.error(err);
    Alert.alert('Error', 'An unexpected error occurred');
  }
};


  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Player Registration</Text>
      <Formik
        initialValues={{
          FirstName: '',
          LastName: '',
          age: '',
          gender:'',
          position: '',
          Dob: new Date(),
          Team: '',
        }}
        validationSchema={PlayerRegistrationSchema}
        onSubmit={(values: PlayerValues, { resetForm }) => 
          registerPlayer(values, resetForm)}
      >
        {({ handleChange, handleBlur, handleSubmit, setFieldValue, values, errors, touched }) => (
          <View>
            <Text style={styles.label}>First Name</Text>
            <TextInput
              placeholder="Enter first name"
              style={styles.input}
               placeholderTextColor="#d4d4d4"
              onChangeText={handleChange('FirstName')}
              onBlur={handleBlur('FirstName')}
              value={values.FirstName}
            />
            {touched.FirstName && errors.FirstName && <Text style={styles.error}>{errors.FirstName}</Text>}

            <Text style={styles.label}>Last Name</Text>
            <TextInput
              placeholder=" Enter last name"
              style={styles.input}
               placeholderTextColor="#d4d4d4"
              onChangeText={handleChange('LastName')}
              onBlur={handleBlur('LastName')}
              value={values.LastName}
            />
            {touched.LastName && errors.LastName && <Text style={styles.error}>{errors.LastName}</Text>}

            <Text style={styles.label}>Age</Text>
            <TextInput
              placeholder="Enter players age "
              style={styles.input}
               placeholderTextColor="#d4d4d4"
              keyboardType="numeric"
              onChangeText={handleChange('age')}
              onBlur={handleBlur('age')}
              value={values.age?.toString() || ''}
            />
            {touched.age && errors.age && <Text style={styles.error}>{errors.age}</Text>}

          <Text style={styles.label}>Date of Birth</Text>
          <Pressable onPress={() => setShowDatePicker(true)} style={styles.input}>
            <Text>{values.Dob ? new Date(values.Dob).toDateString() : 'Select Date of Birth'}</Text>
          </Pressable>
          {showDatePicker && (
            <DateTimePicker
              value={values.Dob ? new Date(values.Dob) : new Date()} // fallback date
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                console.log('Selected Date:', selectedDate);
                if (event.type === 'set' && selectedDate) {
                  setFieldValue('Dob', selectedDate);
                  console.log('DOB Set To:', selectedDate);
                }
              }}
            />
          )}

            <Text style={styles.label}>Gender</Text>
            <RNPickerSelect
              onValueChange={(value) => setFieldValue('gender', value)}
              value={values.gender}
              placeholder={{ label: 'Select gender', value: null }}
              items={genderOptions}
            />
            {touched.gender && errors.gender && <Text style={styles.error}>{errors.gender}</Text>}


            <Text style={styles.label}>Team</Text>
            <TextInput
              placeholder="Enter Team Name"
              style={styles.input}
              placeholderTextColor="#d4d4d4"
              onChangeText={handleChange('Team')}
              onBlur={handleBlur('Team')}
              value={values.Team}
            />
            {touched.Team && errors.Team && <Text style={styles.error}>{errors.Team}</Text>}
            <Text style={styles.label}>Position</Text>
            <RNPickerSelect
              onValueChange={(value) => setFieldValue('position', value)}
              value={values.position}
              placeholder={{ label: 'Select a position', value: null }}
              items={positionOptions}
            />
            {touched.position && errors.position && <Text style={styles.error}>{errors.position}</Text>}
            <TouchableOpacity
            style={styles.button}
            onPress={()=>handleSubmit()}
            >
              <Text style={styles.buttonText}>Submit</Text>
            </TouchableOpacity>
          </View>
        )}
      </Formik>
    </ScrollView>
  );
}
    

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 50,
  },
   label: {
    marginBottom: 4,
    fontSize: 13,
    fontWeight: 'bold',
    fontFamily:'Cal Sans", sans-serif',
  },

  header: {
    fontSize: 24,
    marginBottom: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor:'#00aae4',
    padding: 12,
    marginBottom: 10,
    borderRadius: 20,
  },
  button:{
      marginTop:25,
      backgroundColor:'#007bb8',
      paddingVertical:12,
      paddingHorizontal:20,
      borderRadius:22,
      width:115,

  },
  buttonText:{
    color:'white',
    fontWeight:600,
    textAlign:'center',

  },
  error: {
    color: 'red',
    marginBottom: 10,
  },
});