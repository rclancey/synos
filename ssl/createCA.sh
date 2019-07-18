#!/bin/sh

mkdir newcerts
touch index.txt
echo '01' > serial

openssl genrsa -out ca.key 2048
openssl req -new -x509 -key ca.key -out ca.crt
