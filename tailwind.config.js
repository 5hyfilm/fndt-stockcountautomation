module.exports = {
  theme: {
    extend: {
      screens: {
        xs: "475px",
      },
      animation: {
        in: "slideInFromTop 0.3s ease-out",
      },
      keyframes: {
        slideInFromTop: {
          "0%": { transform: "translateY(-100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
};
