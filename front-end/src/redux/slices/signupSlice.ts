import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';

interface SignupState {
  formData: {
    email: string;
    password: string;
    name: string;
    gender: string;
    birthdate: string;
    phone: string;
    address: string;
    detailAddress: string;
    agreeAll: boolean;
    privacyShare: boolean;
    privacyUse: boolean;
  };
  isLoading: boolean;
  error: string | null;
  registrationResult: {
    statusCode?: number;
    message?: string;
  } | null;
}

const initialState: SignupState = {
  formData: {
    email: '',
    password: '',
    name: '',
    gender: '',
    birthdate: '',
    phone: '',
    address: '',
    detailAddress: '',
    agreeAll: false,
    privacyShare: false,
    privacyUse: false,
  },
  isLoading: false,
  error: null,
  registrationResult: null,
};

function convertShortBirthToNumber(birth: string): number {
  const yearPrefix = parseInt(birth.slice(0, 2), 10) <= 24 ? '20' : '19';
  const fullDate = `${yearPrefix}${birth}`;
  return parseInt(fullDate, 10);
}

export const registerUser = createAsyncThunk(
  'signup/register',
  async (formData: any, { rejectWithValue }) => {
    // FOR LOCAL TEST
    // if (formData.email === 'test@example.com') {
    //   return { statusCode: 200, message: '회원가입 성공' };
    // } else if (formData.email === 'duplicate@example.com') {
    //   return rejectWithValue({ statusCode: 409, message: '이미 존재하는 이메일입니다.'}.message);
    // } else {
    //   return rejectWithValue({ statusCode: 400, message: '회원가입 실패' }.message);
    // }

    // FOR SERVER COMMUNICATION
    try {
      console.log('*회원가입 api request body:', JSON.stringify({
                                                  password: formData.password,
                                                  name: formData.name,
                                                  // dob: parseInt(formData.birthdate, 10),
                                                  dob: convertShortBirthToNumber(formData.birthdate),
                                                  gender: formData.gender,
                                                  contact: formData.phone,
                                                  email: formData.email,
                                                  address: `${formData.address} ${formData.detailAddress}`,
                                                })
      );

      const response = await fetch('https://d1kt6v32r7kma5.cloudfront.net/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: formData.password,
          name: formData.name,
          // dob: parseInt(formData.birthdate, 10),
          dob: convertShortBirthToNumber(formData.birthdate),
          gender: formData.gender,
          contact: formData.phone,
          email: formData.email,
          address: `${formData.address} ${formData.detailAddress}`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        console.log('회원가입 실패');
        console.log(errorData);

        return rejectWithValue(errorData.message);
      }

      const data = await response.json();

      console.log('회원가입 성공');
      console.log('*회원가입 api response:', data);

      return data;
    } catch (error: any) {
      console.log('회원가입 실패');
      console.log(error);

      return rejectWithValue(error.message);
    }
  }
);

const signupSlice = createSlice({
  name: 'signup',
  initialState,
  reducers: {
    setFormData: (state, action: PayloadAction<{field: string, value: string | boolean}>) => {
      (state.formData as any)[action.payload.field] = action.payload.value;
    },
    clearRegistrationResult: (state) => {
      state.isLoading = false;
      state.error = null;
      state.registrationResult = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.registrationResult = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
        state.registrationResult = action.payload;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.registrationResult = { message: action.payload as string };
      });
  },
});

export const { setFormData, clearRegistrationResult } = signupSlice.actions;
export default signupSlice.reducer;