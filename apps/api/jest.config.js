module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  // Rooted at the package, not src: the seed data lives under prisma/ and is hand-written
  // Persian that nothing else would catch a mistake in.
  rootDir: '.',
  testRegex: '(/src/|/prisma/).*\\.spec\\.ts$',
  transform: { '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }] },
  collectCoverageFrom: ['src/**/*.ts', 'prisma/seed-data/**/*.ts'],
  coveragePathIgnorePatterns: ['\\.module\\.ts$', 'main\\.ts$'],
  testEnvironment: 'node',
}
