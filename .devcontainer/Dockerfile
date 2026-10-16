FROM mcr.microsoft.com/devcontainers/python:1-3.12-bookworm

# 基础镜像自带的 yarn apt 源签名密钥已过期，任何 apt-get update 都会失败
# （devcontainer feature 安装、playwright --with-deps 都会踩到）。本课不用 yarn，直接去掉。
RUN rm -f /etc/apt/sources.list.d/yarn.list
