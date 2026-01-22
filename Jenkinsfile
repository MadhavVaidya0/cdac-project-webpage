pipeline {
    agent any

    environment {
        IMAGE_NAME = "devsecops-demo"
        IMAGE_TAG  = "${BUILD_NUMBER}"
    }

    stages {

        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }

        stage('Build Image') {
            steps {
                sh 'docker build -t $IMAGE_NAME:$IMAGE_TAG .'
            }
        }

        stage('Scan Image') {
            steps {
                sh 'trivy image --severity HIGH,CRITICAL $IMAGE_NAME:$IMAGE_TAG || true'
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                sh 'kubectl apply -f k8s-deploy.yaml'
            }
        }
    }
}

