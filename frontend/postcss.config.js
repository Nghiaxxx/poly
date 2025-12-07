module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {
      // Đảm bảo autoprefixer hoạt động đúng trong production
      flexbox: 'no-2009',
    },
  },
};
