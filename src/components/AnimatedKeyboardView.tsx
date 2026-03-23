import React, { useEffect, useRef } from "react";
import {
    Animated,
    Keyboard,
    KeyboardEvent,
    Platform,
} from "react-native";

export default function AnimatedKeyboardView({
    children,
}: {
    children: React.ReactNode;
}) {
    const translateY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const showEvent =
            Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
        const hideEvent =
            Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

        const onShow = (e: KeyboardEvent) => {
            Animated.timing(translateY, {
                toValue: -e.endCoordinates.height,
                duration: 150,
                useNativeDriver: true,
            }).start();
        };

        const onHide = () => {
            Animated.timing(translateY, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
            }).start();
        };

        const showSub = Keyboard.addListener(showEvent, onShow);
        const hideSub = Keyboard.addListener(hideEvent, onHide);

        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, [translateY]);

    return (
        <Animated.View style={{ transform: [{ translateY }], overflow: 'hidden' }}>
            {children}
        </Animated.View>
    );
}
