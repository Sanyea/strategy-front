pipeline {
    parameters {
        string(name: 'SERVICE_NAME', defaultValue: 'strategyfrontend', description: '项目名/镜像名（必填，Harbor strategy 项目下）')
        string(name: 'IMAGE_TAG', defaultValue: 'latest', description: '镜像标签（必填，需与 ci/deploy 清单引用一致）')
    }

    agent {
        kubernetes {
            yaml '''
apiVersion: v1
kind: Pod
metadata:
  annotations:
    jenkinsci.org/durable-task-launch-diagnostics: "true"
spec:
  containers:
  - name: jnlp
    image: 192.168.254.130:32100/library/jenkins/inbound-agent:3309.v27b_9314fd1a_4-1-jdk21
    volumeMounts:
    - name: workspace
      mountPath: /home/jenkins/agent/workspace
  - name: kaniko
    image: 192.168.254.130:32100/library/kaniko-project-executor:v1.13.0-debug
    command: ["/busybox/sh"]
    args: ["-c", "mkdir -p /usr/bin && ln -sf /busybox/env /usr/bin/env && mount -t proc proc /proc > /dev/null 2>&1 || true && sleep infinity"]
    volumeMounts:
    - name: docker-config
      mountPath: /kaniko/.docker/config.json
      subPath: config.json
    - name: workspace
      mountPath: /home/jenkins/agent/workspace
    - name: tmp
      mountPath: /tmp
    - name: proc
      mountPath: /proc
    resources:
      requests:
        cpu: "500m"
        memory: "1Gi"
      limits:
        cpu: "2"
        memory: "2Gi"
    securityContext:
      runAsUser: 0
      runAsGroup: 0
    tty: true
  - name: node
    image: 192.168.254.130:32100/library/node:24.9.0-alpine
    command: ["/bin/sh"]
    args: ["-c", "sleep infinity"]
    volumeMounts:
    - name: workspace
      mountPath: /home/jenkins/agent/workspace
  volumes:
  - name: docker-config
    secret:
      secretName: harbor-robot-cred
      items:
      - key: .dockerconfigjson
        path: config.json
  - name: workspace
    emptyDir: {}
  - name: tmp
    emptyDir: {}
  - name: proc
    hostPath:
      path: /proc
'''
        }
    }

    environment {
        // Harbor NodePort（HTTP），与 ci/deploy 清单及节点 insecure_registries 配置保持一致
        HARBOR_HOST = '192.168.254.130:32100'
        HARBOR_PROJECT = 'strategy'
    }

    stages {
        stage('Init') {
            steps {
                script {
                    env.SERVICE_NAME = params.SERVICE_NAME ?: ''
                    env.IMAGE_TAG = params.IMAGE_TAG ?: ''
                    if (!env.SERVICE_NAME || !env.IMAGE_TAG) {
                        error "❌ 缺少必填参数！"
                    }
                    echo "✅ 项目名/镜像名: ${env.SERVICE_NAME}"
                    echo "✅ 镜像标签: ${env.IMAGE_TAG}"
                    echo "✅ Harbor 地址: ${HARBOR_HOST}"
                }
            }
        }

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Verify Lock') {
            when {
                expression { env.BRANCH_NAME in ['master', 'dev', 'test', 'AI'] }
            }
            steps {
                container('node') {
                    sh '''
                        # 安装 git（Alpine 默认不带）
                        apk add --no-cache git

                        # 解决 Git 的 "dubious ownership" 问题
                        git config --global --add safe.directory $(pwd)

                        # 根据 package.json 重新生成 lock 文件
                        npm install --package-lock-only --ignore-scripts

                        # 检测 lock 文件是否有变更（若变更则构建失败）
                        git diff --exit-code -- package-lock.json

                        # 执行干净安装
                        npm ci
                    '''
                }
            }
        }

        stage('Build and Push Image') {
            when {
                expression { env.BRANCH_NAME in ['master', 'dev', 'test', 'AI'] }
            }
            steps {
                container('kaniko') {
                    sh """
                        /kaniko/executor \
                            --context=. \
                            --dockerfile=Dockerfile \
                            --destination=${HARBOR_HOST}/${HARBOR_PROJECT}/${SERVICE_NAME}:${IMAGE_TAG} \
                            --cache=true \
                            --insecure \
                            --insecure-registry=${HARBOR_HOST} \
                            --verbosity=debug
                    """
                }
            }
        }
    }

    post {
        always {
            echo "构建分支: ${env.BRANCH_NAME}"
            echo "项目名/镜像名: ${env.SERVICE_NAME}"
            echo "镜像标签: ${env.IMAGE_TAG}"
        }
        success {
            echo "🎉 镜像构建成功: ${HARBOR_HOST}/${HARBOR_PROJECT}/${SERVICE_NAME}:${IMAGE_TAG}"
        }
        failure {
            echo "❌ 构建失败，请检查日志。"
        }
    }
}