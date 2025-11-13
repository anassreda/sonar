pipeline {
    agent any

stage('SonarQube Analysis') {
    steps {
        withSonarQubeEnv('SonarQubeServer') {
            script {
                def scannerHome = tool 'SonarScanner4'
                sh """
                    ${scannerHome}/bin/sonar-scanner \
                    -Dsonar.projectKey=DevWeb-Clients \
                    -Dsonar.projectName=DevWeb-Clients \
                    -Dsonar.sources=. \
                    -Dsonar.branch.name=${env.BRANCH_NAME}
                """
            }
        }
    }
}

}
