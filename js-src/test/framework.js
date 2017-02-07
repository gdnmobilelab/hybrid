let pendingTestSuites = [];

export function getAllTests() {
    return pendingTestSuites;
}

export function provide(testsTitle, obj) {

    pendingTestSuites.push({
        name: testsTitle,
        tests: obj
    });

}

