import React, { forwardRef } from "react";
import {
  StyleProp,
  TextInput,
  TextInputProps,
  TextStyle,
} from "react-native";

type AppTextInputProps = TextInputProps & {
  inputStyle?: StyleProp<TextStyle>;
};

const AppTextInput = forwardRef<TextInput, AppTextInputProps>(
  ({ inputStyle, style, ...props }, ref) => {
    return <TextInput ref={ref} {...props} style={[inputStyle, style]} />;
  },
);

AppTextInput.displayName = "AppTextInput";

export default AppTextInput;
