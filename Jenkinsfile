pipeline {
    agent any

    environment {
        IMAGE_NAME = "devsecops-demo"
        IMAGE_TAG  = "${BUILD_NUMBER}"
        REGISTRY   = "localhost:5000"
    }

    stages {

        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }

        stage('Build Docker Image') {
            steps {
                sh '''
                  docker build -t ${IMAGE_NAME}:${IMAGE_TAG} .
                '''
            }
        }

        stage('Trivy Scan') {
            steps {
                sh '''
                  trivy image --severity HIGH,CRITICAL ${IMAGE_NAME}:${IMAGE_TAG} || true
                '''
            }
        }

        stage('Push to Local Registry') {
            steps {
                sh '''
                  docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}
                  docker push ${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}
                '''
            }
        }

        stage('Sign Image with Cosign') {
            steps {
                withCredentials([file(credentialsId: 'cosign-key', variable: 'COSIGN_KEY')]) {
                    sh '''
                      export COSIGN_PASSWORD=""
                      DIGEST=$(docker inspect --format='{{index .RepoDigests 0}}' ${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG} | sed 's|^|localhost:5000/|')
                      cosign sign --key $COSIGN_KEY $DIGEST
                    '''
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                sh '''
                  export IMAGE_TAG=${IMAGE_TAG}
                  envsubst < k8s-deploy.yaml | kubectl apply -f -
                '''
            }
        }
    }
}
