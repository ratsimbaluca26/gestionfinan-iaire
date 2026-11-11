pipeline {
    agent any

    options {
        timeout(time: 45, unit: 'MINUTES')
        disableConcurrentBuilds()
        timestamps()
    }

    environment {
        PATH               = "/home/tahianaluca/.local/bin:${env.PATH}"
        PYTHONPATH         = "/home/tahianaluca/.local/lib/python3.12/site-packages"
        EC2_HOST           = credentials('ec2-host')
        LE_EMAIL           = 'ratsimbaluca986@gmail.com'
        ANSIBLE_CONFIG     = "${WORKSPACE}/ansible/ansible.cfg"
        AWS_DEFAULT_REGION = 'us-east-2'
        AWS_REGION         = 'us-east-2'
    }

    stages {
        stage('Tests unitaires backend') {
            steps {
                sh 'docker compose -f docker-compose.ci.yml run --build --rm backend-unit'
            }
        }

        stage('Tests d’intégration backend + PostgreSQL') {
            steps {
                sh 'docker compose -f docker-compose.ci.yml run --build --rm backend-integration'
            }
            post {
                always {
                    sh 'docker compose -f docker-compose.ci.yml down --volumes --remove-orphans || true'
                }
            }
        }

        stage('Build frontend') {
            steps {
                sh 'docker compose -f docker-compose.ci.yml run --build --rm frontend-build'
            }
        }

        stage('Validation Ansible') {
            steps {
                sh '''
                    set -eu
                    ansible-galaxy collection install -r ansible/requirements.yml
                    ansible-playbook -i localhost, ansible/site.yml --syntax-check
                '''
            }
        }

        stage('Préparer inventaire EC2') {
            steps {
                sh '''
                    set -eu
                    umask 077
                    printf '%s\\n' \\
                      'localhost ansible_connection=local ansible_python_interpreter=/usr/bin/python3' \\
                      '' \\
                      '[ec2]' \\
                      "$EC2_HOST" > ansible/inventory.ini
                '''
            }
        }

        stage('Provisionner le Security Group AWS') {
            steps {
                withCredentials([
                    string(credentialsId: 'aws-access-key', variable: 'AWS_ACCESS_KEY_ID'),
                    string(credentialsId: 'aws-access-secret', variable: 'AWS_SECRET_ACCESS_KEY')
                ]) {
                    sh 'aws sts get-caller-identity && ansible-playbook -i localhost, ansible/security.yml'
                }
            }
        }

        stage('Configurer le serveur EC2') {
            steps {
                withCredentials([
                    sshUserPrivateKey(credentialsId: 'ec2-ssh-key', keyFileVariable: 'SSH_KEY')
                ]) {
                    sh '''
                        ansible-playbook -i ansible/inventory.ini ansible/server.yml \\
                          --private-key "$SSH_KEY" -u ubuntu
                    '''
                }
            }
        }

        stage('Déployer application et configuration') {
            steps {
                withCredentials([
                    sshUserPrivateKey(credentialsId: 'ec2-ssh-key', keyFileVariable: 'SSH_KEY'),
                    string(credentialsId: 'db-password', variable: 'DB_PASSWORD'),
                    string(credentialsId: 'jwt-secret', variable: 'JWT_SECRET'),
                    usernamePassword(
                        credentialsId: '7706b8c4-2d26-416c-baaa-70c17d6bcd22',
                        usernameVariable: 'GMAIL_USER',
                        passwordVariable: 'GMAIL_APP_PASSWORD'
                    )
                ]) {
                    sh '''
                        ansible-playbook -i ansible/inventory.ini ansible/application.yml \\
                          --private-key "$SSH_KEY" -u ubuntu
                    '''
                }
            }
        }

        stage('Configurer Nginx et HTTPS') {
            steps {
                withCredentials([
                    sshUserPrivateKey(credentialsId: 'ec2-ssh-key', keyFileVariable: 'SSH_KEY')
                ]) {
                    sh '''
                        ansible-playbook -i ansible/inventory.ini ansible/web.yml \\
                          --private-key "$SSH_KEY" -u ubuntu
                    '''
                }
            }
        }

        stage('Smoke test production') {
            steps {
                sh 'ansible-playbook -i localhost, ansible/health.yml'
            }
        }
    }

    post {
        success { echo 'Tests, validations et déploiement réussis : https://finiova.app' }
        failure { echo 'Pipeline interrompu : le déploiement ne démarre pas si les tests ou validations échouent.' }
        always {
            sh 'docker compose -f docker-compose.ci.yml down --volumes --remove-orphans || true'
            sh 'rm -f ansible/inventory.ini'
        }
    }
}
