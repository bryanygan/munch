module.exports = function (api) {
  const isTest = api.env('test');
  api.cache(true);
  return {
    presets: [
      [
        'babel-preset-expo',
        // Disable reanimated plugin in Jest (react-native-worklets/plugin not available in test env)
        isTest ? { reanimated: false } : {},
      ],
    ],
  };
};
