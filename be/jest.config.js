module.exports = {
    testEnvironment: 'node',
    collectCoverageFrom: [
        'controllers/**/*.js'
    ],
    coverageReporters: ['text', 'lcov']
};