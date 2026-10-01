pipeline {
    
    agent any

    environment {
        DOCKER_USERNAME = "bobcodeur"
        FRONTEND_IMAGE = "${DOCKER_USERNAME}/diaba-frontend"
        FRONTEND_TAG = "1.${BUILD_NUMBER}"

        // Job de déploiement déclenché après un build réussi.
        // ⚠️ Doit correspondre EXACTEMENT au nom du job dans Jenkins :
        // un renommage côté Jenkins fait échouer l'étape « post success ».
        DEPLOY_JOB = 'Tendo-deploiement'

        // Configuration SMTP pour les notifications par email
        RECEIVER_NOTIFICATION_EMAIL = "abdoulayembaye885@gmail.com"
        SENDER_NOTIFICATION_EMAIL = "bobcodeur@gmail.com"
        SMTP_CREDENTIALS_ID = "gmail-credentials"
    }

    stages{
        stage('Checkout') {
            steps {
                echo "Clonage du dépôt frontend..."
                // dir("Frontend") {
                    // Le plugin Git de Jenkins utilisera les informations de SCM configurées pour ce job
                    checkout scm
                // }
            }
        }

        // Étape d'analyse SonarQube pour le frontend React
        stage('Analyse SonarQube Frontend') {
            steps {
                echo "Analyse SonarQube pour le frontend..."
                // dir('Frontend') {
                    script {
                        withSonarQubeEnv('SonarQube') {
                            withCredentials([string(credentialsId: 'sonar-credentials', variable: 'SONAR_AUTH_TOKEN')]) {
                                // Récupère le chemin du scanner déclaré dans Jenkins Tools
                                def scannerHome = tool name: 'SonarQubeScanner', type: 'hudson.plugins.sonar.SonarRunnerInstallation'
                                    
                                sh """
                                    ${scannerHome}/bin/sonar-scanner \
                                    -Dsonar.organization=diaba-ecommerce \
                                    -Dsonar.projectKey=diaba-ecommerce_frontend-react \
                                    -Dsonar.projectName="frontend-react" \
                                    -Dsonar.sources=src \
                                    -Dsonar.host.url=https://sonarcloud.io \
                                    -Dsonar.token=${SONAR_AUTH_TOKEN}
                                """
                            }
                        }
                    }
                // }
            }
        }

        // // Étape OWASP Dependency-Check pour le frontend React
        // stage('OWASP Dependency-Check Frontend') {
        //     steps {
        //         echo "Analyse OWASP Dependency-Check..."
        //         // dir('Frontend') {
        //             script {
        //                 def depCheckHome = tool(
        //                     name: 'Owasp-Dependency-Check',
        //                     type: 'org.jenkinsci.plugins.DependencyCheck.tools.DependencyCheckInstallation'
        //                 )

        //                 sh """
        //                     mkdir -p reports
        //                     # Seuil de gravité pour échouer le build (ici CVSS = 10)
        //                     ${depCheckHome}/bin/dependency-check.sh \
        //                     --scan . \
        //                     --disableAssembly \
        //                     --disableYarnAudit \
        //                     --format HTML --format XML \
        //                     --out reports
        //                 """
        //             }
        //         // }
        //     }

        //     post {
        //         always {
        //             dependencyCheckPublisher pattern: 'reports/dependency-check-report.xml'

        //             archiveArtifacts artifacts: 'reports/dependency-check-report.html',
        //                             fingerprint: true
        //         }
        //     }
        // }

        // Étape de construction de l'image Docker pour le frontend React
        stage('Build Frontend Docker Image') {
            steps {
                echo "Construction de l'image ${FRONTEND_IMAGE}:${FRONTEND_TAG}..."
                // dir('Frontend'){
                    script {
                        sh "docker build -t ${FRONTEND_IMAGE}:${FRONTEND_TAG} ."
                    }
                // }
            }
        }

        // Étape de push de l'image Docker vers Docker Hub
        stage('Push Frontend Docker Image') {
            steps {
                echo "Pushing ${FRONTEND_IMAGE}:${FRONTEND_TAG} to Docker Hub..."
                script {
                    withCredentials([usernamePassword(credentialsId: 'dockerhub-credentials', usernameVariable: 'DOCKER_HUB_USERNAME', passwordVariable: 'DOCKER_HUB_PASSWORD')]) {
                        sh """
                            echo "${DOCKER_HUB_PASSWORD}" | docker login -u "${DOCKER_HUB_USERNAME}" --password-stdin
                            
                            # Push avec le tag spécifique (ex: 1.1, 1.2, etc.)
                            docker push ${FRONTEND_IMAGE}:${FRONTEND_TAG}
                            
                            # Tag et push en tant que 'latest' pour le déploiement CD
                            docker tag ${FRONTEND_IMAGE}:${FRONTEND_TAG} ${FRONTEND_IMAGE}:latest
                            docker push ${FRONTEND_IMAGE}:latest
                            
                            echo "Image poussée: ${FRONTEND_IMAGE}:${FRONTEND_TAG} et ${FRONTEND_IMAGE}:latest"
                        """
                    }
                }
            }
        }
    }

    // Notifications par email en cas de succès ou d'échec du pipeline
    post {
        success {
            // Lancer le job de déploiement CD après un build réussi
            build job: env.DEPLOY_JOB, wait: false

            echo "Le pipeline a réussi"
            emailext (
                from: "${SENDER_NOTIFICATION_EMAIL}",
                to: "${RECEIVER_NOTIFICATION_EMAIL}",
                subject: "Déploiement Réussi : ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                body: """
                    <p>Bonjour,</p>
                    <p>Le déploiement du job <b>${env.JOB_NAME}</b> (build #${env.BUILD_NUMBER}) a été effectué avec succès.</p>
                    <p>Voir les détails : <a href="${env.BUILD_URL}">${env.BUILD_URL}</a></p>
                    <p>Cordialement.</p>
                """,
                    // mimeType: 'text/html'
            )
        }

        failure {
            echo "Le pipeline a échoué"
            emailext (
                from: "${SENDER_NOTIFICATION_EMAIL}",
                to: "${RECEIVER_NOTIFICATION_EMAIL}",
                subject: "Échec du Déploiement : ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                body: """
                    <p>Bonjour,</p>
                    <p>Le pipeline <b>${env.JOB_NAME}</b> (build #${env.BUILD_NUMBER}) a échoué.</p>
                    <p>Veuillez consulter les logs : <a href="${env.BUILD_URL}">${env.BUILD_URL}</a></p>
                    <p>Cordialement.</p>
                """
            )
        }

    }
}