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
              FRONTEND_SHA=$(docker inspect --format='{{index .RepoDigests 0}}' ${REGISTRY}/${FRONTEND_IMAGE}:${IMAGE_TAG} | cut -d@ -f2)
              BACKEND_SHA=$(docker inspect --format='{{index .RepoDigests 0}}' ${REGISTRY}/${BACKEND_IMAGE}:${IMAGE_TAG} | cut -d@ -f2)

              FRONTEND_DIGEST=${REGISTRY}/${FRONTEND_IMAGE}@${FRONTEND_SHA}
              BACKEND_DIGEST=${REGISTRY}/${BACKEND_IMAGE}@${BACKEND_SHA}

              echo "Signing $FRONTEND_DIGEST"
              echo "Signing $BACKEND_DIGEST"

              COSIGN_DOCKER_MEDIA_TYPES=1 cosign sign --key $COSIGN_KEY $FRONTEND_DIGEST
              COSIGN_DOCKER_MEDIA_TYPES=1 cosign sign --key $COSIGN_KEY $BACKEND_DIGEST
            '''
        }
    }
}

        
stage('Deploy to Kubernetes') {
    environment {
        KUBECONFIG = "/var/lib/jenkins/.kube/config"
    }
    steps {
        sh '''
          kubectl apply -f k8s/mysql.yaml
          kubectl apply -f k8s/backend.yaml
          kubectl apply -f k8s/frontend.yaml
        '''
    }
}
