import { useCallback, useEffect, useRef } from "react";
import { FlatList, NativeSyntheticEvent, NativeScrollEvent } from "react-native";

export const useChatAutoScroll = (
  messagesLength: number,
  streaming: boolean,
  activeChatId: string | null,
  latestAssistantText: string
) => {
  const flatListRef = useRef<FlatList>(null);
  const shouldAutoScrollRef = useRef(true);
  const followStreamingRef = useRef(true);
  const lastAutoScrollAtRef = useRef(0);

  const scrollToBottom = useCallback((animated = true) => {
    requestAnimationFrame(() => {
      flatListRef.current?.scrollToEnd({ animated });
    });
  }, []);

  useEffect(() => {
    if (messagesLength) {
      scrollToBottom(!streaming);
    }
  }, [activeChatId, messagesLength, streaming, scrollToBottom]);

  useEffect(() => {
    if (streaming) {
      followStreamingRef.current = true;
      shouldAutoScrollRef.current = true;
    }
  }, [streaming, activeChatId]);

  useEffect(() => {
    if (!streaming || !followStreamingRef.current) return;
    scrollToBottom(false);
  }, [latestAssistantText, streaming, scrollToBottom]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { y } = event.nativeEvent.contentOffset;
      const viewportHeight = event.nativeEvent.layoutMeasurement.height;
      const contentHeight = event.nativeEvent.contentSize.height;
      const distanceFromBottom = contentHeight - (y + viewportHeight);

      const isNearBottom = distanceFromBottom < 140;
      shouldAutoScrollRef.current = isNearBottom;
      if (!isNearBottom && streaming) {
        followStreamingRef.current = false;
      }
      if (isNearBottom && !streaming) {
        followStreamingRef.current = true;
      }
    },
    [streaming]
  );

  const handleScrollBeginDrag = useCallback(() => {
    if (streaming) {
      followStreamingRef.current = false;
    }
  }, [streaming]);

  const handleScrollEnd = useCallback(() => {
    if (shouldAutoScrollRef.current) {
      followStreamingRef.current = true;
    }
  }, []);

  const handleContentSizeChange = useCallback(() => {
    if (!shouldAutoScrollRef.current && !followStreamingRef.current) return;

    const now = Date.now();
    if (streaming && now - lastAutoScrollAtRef.current < 45) return;
    lastAutoScrollAtRef.current = now;

    scrollToBottom(!streaming);
  }, [streaming, scrollToBottom]);

  const handleLayout = useCallback(() => {
    if (messagesLength) {
      scrollToBottom(false);
    }
  }, [messagesLength, scrollToBottom]);

  return {
    flatListRef,
    scrollToBottom,
    onScroll: handleScroll,
    onScrollBeginDrag: handleScrollBeginDrag,
    onMomentumScrollEnd: handleScrollEnd,
    onScrollEndDrag: handleScrollEnd,
    onContentSizeChange: handleContentSizeChange,
    onLayout: handleLayout,
  };
};
