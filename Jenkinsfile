pipeline {
    agent any

    environment {
        REGISTRY = "192.168.10.130:5000"   // real registry IP
        FRONTEND_IMAGE = "todo-frontend"
        BACKEND_IMAGE  = "todo-backend"
        TAG = "${BUILD_NUMBER}"
        KUBECONFIG = "/var/lib/jenkins/.kube/config"
        BACKEND_API_URL = "http://192.168.10.129:30001"
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
          # Backend (cache is OK)
          docker build -t $REGISTRY/$BACKEND_IMAGE:$TAG backend

          # Frontend (NO CACHE to force CSS/JS rebuild)
          docker build --no-cache \
            --build-arg API_URL=$BACKEND_API_URL \
            -t $REGISTRY/$FRONTEND_IMAGE:$TAG frontend
        '''
    }
}


        stage('Trivy Scan') {
            steps {
                sh '''
                  trivy image --severity HIGH,CRITICAL $REGISTRY/$BACKEND_IMAGE:$TAG || true
                  trivy image --severity HIGH,CRITICAL $REGISTRY/$FRONTEND_IMAGE:$TAG || true
                '''
            }
        }

        stage('Push Images') {
            steps {
                sh '''
                  docker push $REGISTRY/$BACKEND_IMAGE:$TAG
                  docker push $REGISTRY/$FRONTEND_IMAGE:$TAG
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
                      BACKEND_DIGEST=$(docker inspect --format='{{index .RepoDigests 0}}' $REGISTRY/$BACKEND_IMAGE:$TAG)
                      FRONTEND_DIGEST=$(docker inspect --format='{{index .RepoDigests 0}}' $REGISTRY/$FRONTEND_IMAGE:$TAG)

                      COSIGN_DOCKER_MEDIA_TYPES=1 cosign sign --key $COSIGN_KEY $BACKEND_DIGEST
                      COSIGN_DOCKER_MEDIA_TYPES=1 cosign sign --key $COSIGN_KEY $FRONTEND_DIGEST
                    '''
                }
            }
        }

      
    stage('Deploy to Kubernetes') {
    steps {
        sh '''
          kubectl set image deployment/backend backend=$REGISTRY/$BACKEND_IMAGE:$TAG
          kubectl set image deployment/frontend frontend=$REGISTRY/$FRONTEND_IMAGE:$TAG

          kubectl rollout status deployment/backend
          kubectl rollout status deployment/frontend
        '''
    }
}
}
}
