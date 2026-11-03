pipeline {
    agent any

    options {
        timeout(time: 25, unit: 'MINUTES')
        disableConcurrentBuilds()
    }

    environment {
        PATH           = "/home/tahianaluca/.local/bin:${env.PATH}"
        PYTHONPATH     = "/home/tahianaluca/.local/lib/python3.12/site-packages"
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
                    string(credentialsId: 'aws-access-secret-key', variable: 'AWS_SECRET_ACCESS_KEY')
                ]) {
                    sh '''
                        echo "localhost ansible_connection=local ansible_python_interpreter=/usr/bin/python3" > ansible/inventory.ini
                        echo "" >> ansible/inventory.ini
                        echo "[ec2]" >> ansible/inventory.ini
                        echo "${EC2_HOST}" >> ansible/inventory.ini

                        ansible-galaxy collection install -r ansible/requirements.yml
                        ansible-playbook -i ansible/inventory.ini ansible/site.yml \
                          --private-key "$SSH_KEY" -u ubuntu \
                          --extra-vars "db_password=${DB_PASSWORD} jwt_secret=${JWT_SECRET} letsencrypt_email=${LE_EMAIL}"
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