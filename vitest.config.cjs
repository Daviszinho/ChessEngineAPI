module.exports = {
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.js'],
    coverage: {
      provider: 'v8',
      exclude: ['src/adapters/**', 'engines/**', 'functions/**', 'src/server.js']
    }
  }
};

