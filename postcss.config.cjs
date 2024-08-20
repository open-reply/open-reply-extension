module.exports = {
  plugins: [
    require('autoprefixer'),
    require('tailwindcss'),
    require('postcss-rem-to-responsive-pixel')({
      rootValue: 16,
      propList: ['*'],
      transformUnit: 'px',
    }),
  ]
};