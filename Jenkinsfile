pipeline {
    agent any

    environment {
        REGISTRY = "localhost:5000"
        FRONTEND_IMAGE = "todo-frontend"
        BACKEND_IMAGE  = "todo-backend"
        IMAGE_TAG = "${BUILD_NUMBER}"
    }

    stages {

        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('sonarqube') {
                    sh '''
                      sonar-scanner \
                      -Dsonar.projectKey=todo-app \
                      -Dsonar.sources=. \
                      -Dsonar.host.url=http://localhost:9000 \
                      -Dsonar.login=$SONAR_AUTH_TOKEN
                    '''
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                sh '''
                  docker build -t ${FRONTEND_IMAGE}:${IMAGE_TAG} frontend/
                  docker build -t ${BACKEND_IMAGE}:${IMAGE_TAG} backend/
                '''
            }
        }

        stage('Trivy Scan') {
            steps {
                sh '''
                  trivy image --severity HIGH,CRITICAL ${FRONTEND_IMAGE}:${IMAGE_TAG} || true
                  trivy image --severity HIGH,CRITICAL ${BACKEND_IMAGE}:${IMAGE_TAG} || true
                '''
            }
        }

        stage('Push to Local Registry') {
            steps {
                sh '''
                  docker tag ${FRONTEND_IMAGE}:${IMAGE_TAG} ${REGISTRY}/${FRONTEND_IMAGE}:${IMAGE_TAG}
                  docker tag ${BACKEND_IMAGE}:${IMAGE_TAG} ${REGISTRY}/${BACKEND_IMAGE}:${IMAGE_TAG}

                  docker push ${REGISTRY}/${FRONTEND_IMAGE}:${IMAGE_TAG}
                  docker push ${REGISTRY}/${BACKEND_IMAGE}:${IMAGE_TAG}
                '''
            }
        }

        stage('Sign Images with Cosign') {
            steps {
                withCredentials([
                    file(credentialsId: 'cosign-key', variable: 'COSIGN_KEY'),
                    string(credentialsId: 'cosign-pass', variable: 'COSIGN_PASSWORD')
                ]) {
                    sh '''
                      cosign sign --key $COSIGN_KEY ${REGISTRY}/${FRONTEND_IMAGE}:${IMAGE_TAG}
                      cosign sign --key $COSIGN_KEY ${REGISTRY}/${BACKEND_IMAGE}:${IMAGE_TAG}
                    '''
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                sh '''
                  kubectl apply -f k8s/mysql.yaml
                  kubectl apply -f k8s/backend.yaml
                  kubectl apply -f k8s/frontend.yaml
                '''
            }
        }
    }
}

pipeline {
    agent any

    environment {
        FRONTEND_IMAGE = "todo-frontend"
        BACKEND_IMAGE  = "todo-backend"
        IMAGE_TAG = "latest"
    }

    stages {

        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('sonarqube') {
                    sh '''
                      sonar-scanner \
                      -Dsonar.projectKey=todo-app \
                      -Dsonar.sources=. \
                      -Dsonar.host.url=http://localhost:9000 \
                      -Dsonar.login=$SONAR_AUTH_TOKEN
                    '''
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                sh '''
                  docker build -t ${FRONTEND_IMAGE}:${IMAGE_TAG} frontend/
                  docker build -t ${BACKEND_IMAGE}:${IMAGE_TAG} backend/
                '''
            }
        }

        stage('Trivy Scan') {
            steps {
                sh '''
                  trivy image --severity HIGH,CRITICAL ${FRONTEND_IMAGE}:${IMAGE_TAG} || true
                  trivy image --severity HIGH,CRITICAL ${BACKEND_IMAGE}:${IMAGE_TAG} || true
                '''
            }
        }

        stage('Export Images for K3s Worker') {
            steps {
                sh '''
                  docker save ${BACKEND_IMAGE}:latest -o k8s/todo-backend.tar
                  docker save ${FRONTEND_IMAGE}:latest -o k8s/todo-frontend.tar
                '''
            }
        }

        stage('Deploy to Kubernetes (K3s)') {
            steps {
                sh '''
                  sudo k3s kubectl apply -f k8s/mysql.yaml
                  sudo k3s kubectl apply -f k8s/backend.yaml
                  sudo k3s kubectl apply -f k8s/frontend.yaml
                '''
            }
        }
    }
}
