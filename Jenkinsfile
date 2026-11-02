pipeline {
    agent any

    options {
        timeout(time: 25, unit: 'MINUTES')
        disableConcurrentBuilds()
    }

    environment {
        EC2_HOST       = credentials('ec2-host')
        LE_EMAIL       = 'ratsimbaluca986@gmail.com'
        ANSIBLE_CONFIG = "${WORKSPACE}/ansible/ansible.cfg"
    }

    stages {
        stage('Check conflicts') {
            steps {
                sh '! grep -rn "^<<<<<<<\\|^>>>>>>>" --include=*.js --include=*.yml --exclude-dir=node_modules .'
            }
        }

        stage('Ansible') {
            steps {
                withCredentials([
                    sshUserPrivateKey(credentialsId: 'ec2-ssh-key', keyFileVariable: 'SSH_KEY'),
                    string(credentialsId: 'db-password', variable: 'DB_PASSWORD'),
                    string(credentialsId: 'jwt-secret', variable: 'JWT_SECRET'),
                    string(credentialsId: 'aws-access-key-id', variable: 'AWS_ACCESS_KEY_ID'),
                    string(credentialsId: 'aws-secret-access-key', variable: 'AWS_SECRET_ACCESS_KEY')
                ]) {
                    sh '''
                        echo "[ec2]" > ansible/inventory.ini
                        echo "${EC2_HOST}" >> ansible/inventory.ini

                        ansible-galaxy collection install -r ansible/requirements.yml
                        ansible-playbook -i ansible/inventory.ini ansible/site.yml \
                          --private-key "$SSH_KEY" -u ubuntu
                    '''
                }
            }
        }
    }

    post {
        success { echo 'Deploiement reussi : https://finiova.app' }
        failure { echo 'Echec du deploiement : voir Console Output.' }
    }
}
