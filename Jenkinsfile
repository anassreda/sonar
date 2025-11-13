pipeline {
    agent any

stage('SonarQube Analysis') {
    steps {
        withSonarQubeEnv('SonarQubeServer') {
            withCredentials([string(credentialsId: 'sonar-token', variable: 'SONAR_TOKEN')]) {
                script {
                    def scannerHome = tool 'SonarScanner4'
                    sh """
                        ${scannerHome}/bin/sonar-scanner \
                        -Dsonar.login=$SONAR_TOKEN
                    """
                }
            }
        }
    }
}

}
