import { forwardRef, useEffect, useRef } from "react";
import {
  Dimensions,
  findNodeHandle,
  Keyboard,
  Platform,
  ScrollView,
  TextInput,
  UIManager,
  View,
} from "react-native";

const KeyboardAwareScrollView = forwardRef(function KeyboardAwareScrollView(
  { children, onScroll, ...props },
  forwardedRef
) {
  const scrollRef = useRef(null);
  const contentRef = useRef(null);
  const scrollOffset = useRef(0);

  const setScrollRef = (node) => {
    scrollRef.current = node;
    if (typeof forwardedRef === "function") forwardedRef(node);
    else if (forwardedRef) forwardedRef.current = node;
  };

  useEffect(() => {
    if (Platform.OS !== "android" && Platform.OS !== "ios") return undefined;

    const scrollFocusedInputIntoView = (keyboardHeight = 0) => {
      const focusedInput = TextInput.State.currentlyFocusedInput?.();
      const scrollNode = findNodeHandle(contentRef.current);
      const focusedNode = findNodeHandle(focusedInput);
      if (!focusedInput || !scrollNode || !focusedNode || !scrollRef.current) return;

      UIManager.measureLayout(
        focusedNode,
        scrollNode,
        () => {},
        (_x, y, _width, height) => {
          const viewportHeight = Math.max(
            160,
            Dimensions.get("window").height - keyboardHeight
          );
          const topInset = 24;
          const bottomInset = 32;
          const currentOffset = scrollOffset.current;
          const visibleTop = currentOffset + topInset;
          const visibleBottom = currentOffset + viewportHeight - bottomInset;
          let nextOffset = currentOffset;

          if (y < visibleTop) nextOffset = Math.max(0, y - topInset);
          else if (y + height > visibleBottom) {
            nextOffset = Math.max(0, y + height - viewportHeight + bottomInset);
          }

          if (Math.abs(nextOffset - currentOffset) > 2) {
            scrollRef.current.scrollTo({ y: nextOffset, animated: true });
          }
        }
      );
    };

    const showSubscription = Keyboard.addListener("keyboardDidShow", (event) => {
      setTimeout(() => scrollFocusedInputIntoView(event?.endCoordinates?.height || 0), 80);
    });
    const frameSubscription = Keyboard.addListener("keyboardDidChangeFrame", (event) => {
      setTimeout(() => scrollFocusedInputIntoView(event?.endCoordinates?.height || 0), 40);
    });

    return () => {
      showSubscription.remove();
      frameSubscription.remove();
    };
  }, []);

  return (
    <ScrollView
      {...props}
      ref={setScrollRef}
      scrollEventThrottle={16}
      onScroll={(event) => {
        scrollOffset.current = event.nativeEvent.contentOffset.y;
        onScroll?.(event);
      }}
    >
      <View ref={contentRef} collapsable={false} style={{ width: "100%" }}>
        {children}
      </View>
    </ScrollView>
  );
});

export default KeyboardAwareScrollView;
