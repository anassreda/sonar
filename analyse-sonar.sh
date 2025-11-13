#!/bin/bash
sonar-scanner\
  -Dsonar.projectKey=DevWeb-Clients \
  -Dsonar.projectName=DevWeb-Clients \
  -Dsonar.projectVersion=1.0 \
  -Dsonar.sources=. \
  -Dsonar.host.url=http://localhost:9000 \
  -Dsonar.login=sqp_e4c7fc778e8910e530817f0eee67442c6123afe1 \
  -Dsonar.sourceEncoding=UTF-8