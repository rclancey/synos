#!/usr/bin/env python

import sys
import os
import subprocess
import argparse

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--country', default='US')
    ap.add_argument('--state', default='California')
    ap.add_argument('--city', default='Los Angeles')
    ap.add_argument('--organization', required=True)
    ap.add_argument('--unit', default=None)
    ap.add_argument('--email', required=True)
    ap.add_argument('--domain', required=True)
    args = ap.parse_args()
    f = open('cacrt.conf', 'w')
    f.write("""# The main section is named req because the command we are using is req
# (openssl req ...)
[ req ]
# This specifies the default key size in bits. If not specified then 512 is
# used. It is used if the -new option is used. It can be overridden by using
# the -newkey option. 
default_bits = 2048

# This is the default filename to write a private key to. If not specified the
# key is written to standard output. This can be overridden by the -keyout
# option.
default_keyfile = ca.key

# If this is set to no then if a private key is generated it is not encrypted.
# This is equivalent to the -nodes command line option. For compatibility
# encrypt_rsa_key is an equivalent option. 
encrypt_key = no

# This option specifies the digest algorithm to use. Possible values include
# md5 sha1 mdc2. If not present then MD5 is used. This option can be overridden
# on the command line.
#default_md = sha1
default_md = sha256

# if set to the value no this disables prompting of certificate fields and just
# takes values from the config file directly. It also changes the expected
# format of the distinguished_name and attributes sections.
prompt = no

# if set to the value yes then field values to be interpreted as UTF8 strings,
# by default they are interpreted as ASCII. This means that the field values,
# whether prompted from a terminal or obtained from a configuration file, must
# be valid UTF8 strings.
utf8 = yes

# This specifies the section containing the distinguished name fields to
# prompt for when generating a certificate or certificate request.
distinguished_name = my_req_distinguished_name

[ my_req_distinguished_name ]
""")
    f.write("C = {country}\n".format(country=args.country))
    f.write("ST = {state}\n".format(state=args.state))
    f.write("L = {city}\n".format(city=args.city))
    f.write("O = {organization}\n".format(organization=args.organization))
    if args.unit is not None:
        f.write("OU = {unit}\n".format(unit=args.unit))
    f.write("CN = {domain}/emailAddress={email}\n".format(domain=args.domain, email=args.email))
    f.close()

    f = open('ca.conf', 'w')
    f.write("""# we use 'ca' as the default section because we're usign the ca command
[ ca ]
default_ca = my_ca

[ my_ca ]
#  a text file containing the next serial number to use in hex. Mandatory.
#  This file must be present and contain a valid serial number.
serial = ./serial

# the text database file to use. Mandatory. This file must be present though
# initially it will be empty.
database = ./index.txt

# specifies the directory where new certificates will be placed. Mandatory.
new_certs_dir = ./newcerts

# the file containing the CA certificate. Mandatory
certificate = ./ca.crt

# the file contaning the CA private key. Mandatory
private_key = ./ca.key

# the message digest algorithm. Remember to not use MD5
#default_md = sha1
default_md = sha256

# for how many days will the signed certificate be valid
default_days = 3653

# a section with a set of variables corresponding to DN fields
policy = my_policy

[ my_policy ]
# if the value is "match" then the field value must match the same field in the
# CA certificate. If the value is "supplied" then it must be present.
# Optional means it may be present. Any fields not mentioned are silently
# deleted.
countryName = match
stateOrProvinceName = match
organizationName = match
commonName = supplied
organizationalUnitName = optional
commonName = supplied
""")
    f.close()

    os.mkdir("newcerts")
    f = open('index.txt', 'w')
    f.close()
    f = open('serial', 'w')
    f.write("01\n")
    f.close()
    ret = subprocess.Popen(['openssl', 'genrsa', '-out', 'ca.key', '2048']).wait()
    ret = subprocess.Popen(['openssl', 'req', '-new', '-x509', '-config', 'cacrt.conf', '-days', '3653', '-key', 'ca.key', '-out', 'ca.crt']).wait()

if '__main__' == __name__:
    main()

