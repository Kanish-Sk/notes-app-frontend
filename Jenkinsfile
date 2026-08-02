pipeline {
    agent any

    parameters {
        booleanParam(name: 'DEPLOY', defaultValue: true, description: 'Deploy the built artifact to DEPLOY_DIR after building')
        string(name: 'DEPLOY_DIR', defaultValue: '/data/workspace/note-fusion-ui', description: 'Target directory to deploy the built dist/ files to (only used when DEPLOY is checked)')
    }

    environment {
        DEPLOY_DIR = "${params.DEPLOY_DIR}"
    }

    stages {
        stage('Validate Config') {
            steps {
                script {
                    if (params.DEPLOY && !env.DEPLOY_DIR?.trim()) {
                        error "DEPLOY is checked but DEPLOY_DIR is empty. Provide a target directory or uncheck DEPLOY."
                    }
                    echo "DEPLOY      = ${params.DEPLOY}"
                    if (params.DEPLOY) {
                        echo "DEPLOY_DIR  = ${env.DEPLOY_DIR}"
                    } else {
                        echo "DEPLOY_DIR  = (skipped, DEPLOY is unchecked)"
                    }
                }
            }
        }

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Build') {
            steps {
                configFileProvider([configFile(fileId: 'note-fusion-env', targetLocation: '.env.production')]) {
                    sh '''
                        if [ ! -s .env.production ] || ! grep -q '^VITE_API_BASE_URL=' .env.production; then
                            echo "ERROR: .env.production is missing or missing VITE_API_BASE_URL. Check the 'note-fusion-env' managed config file in Jenkins."
                            exit 1
                        fi
                    '''
                    sh 'npm run build'
                }
                sh '''
                    echo "===== Verifying built bundle for stray localhost refs ====="
                    if grep -r "localhost:8000" dist/assets/*.js 2>/dev/null; then
                        echo "ERROR: Found hardcoded localhost:8000 in build output. Check src/ for a fallback that bypasses VITE_API_BASE_URL."
                        exit 1
                    else
                        echo "OK: no hardcoded localhost:8000 found in dist/"
                    fi
                '''
            }
        }

        stage('Verify Build Output') {
            steps {
                sh '''
                    if [ ! -d dist ] || [ -z "$(ls -A dist)" ]; then
                        echo "ERROR: dist/ is missing or empty. Aborting deploy to avoid wiping the live site."
                        exit 1
                    fi
                '''
            }
        }

        stage('Package Artifact') {
            steps {
                sh "tar -czf note-fusion-ui-dist-${env.BUILD_NUMBER}.tar.gz -C dist ."
                archiveArtifacts artifacts: "note-fusion-ui-dist-${env.BUILD_NUMBER}.tar.gz", fingerprint: true
            }
        }

        stage('Deploy') {
            when {
                expression { return params.DEPLOY }
            }
            steps {
                sh '''
                    mkdir -p "$DEPLOY_DIR"
                    rsync -a --delete dist/ "$DEPLOY_DIR/"
                '''
            }
        }
    }

    post {
        always {
            sh 'rm -f .env.production'
        }
        success {
            script {
                if (params.DEPLOY) {
                    echo "Deployed dist/ to ${DEPLOY_DIR}"
                } else {
                    echo "Build succeeded. DEPLOY was unchecked, so deploy was skipped — download the artifact from this build's page."
                }
            }
        }
        failure {
            echo "Build/deploy failed — check the console log above."
        }
    }
}
