module.exports = {
    collectCoverage: true,
    collectCoverageFrom: ['src/**/*.ts', '!src/declarations/**/*', '!test'],
    moduleFileExtensions: ['ts', 'js'],
    testMatch: ['**/*.test.(ts|js)'],
    testEnvironment: 'node',
    transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest'
    },
    globals: {
        'ts-jest': {
            tsConfig: 'tsconfig.json'
        }
    },
    reporters: ['default', 'jest-junit'],
    coverageReporters: ['text'],
    coverageDirectory: 'coverage',
    preset: 'ts-jest',
    watchPathIgnorePatterns: ['node_modules']
};
