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
    ap.add_argument('--alias', action='append', default=[])
    args = ap.parse_args()
    if args.unit is not None:
        kn = args.unit.replace(' ', '_').lower()
    else:
        kn = args.organization.replace(' ', '_').lower()
    f = open('{}.conf'.format(kn), 'w')
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
default_keyfile = {}.key

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


# this specifies the configuration file section containing a list of extensions
# to add to the certificate request. It can be overridden by the -reqexts
# command line switch. See the x509v3_config(5) manual page for details of the
# extension section format.
req_extensions = my_extensions

[ my_req_distinguished_name ]
""".format(kn))
    f.write("C = {country}\n".format(country=args.country))
    f.write("ST = {state}\n".format(state=args.state))
    f.write("L = {city}\n".format(city=args.city))
    f.write("O = {organization}\n".format(organization=args.organization))
    if args.unit is not None:
        f.write("OU = {unit}\n".format(unit=args.unit))
    f.write("CN = {domain}/emailAddress={email}\n".format(domain=args.domain, email=args.email))
    f.write("""
[ my_extensions ]
basicConstraints=CA:FALSE
subjectAltName=@my_subject_alt_names
subjectKeyIdentifier = hash

[ my_subject_alt_names ]
""")
    for i, name in enumerate(args.alias):
        f.write("DNS.{} = {}\n".format(i+1, name))
    f.close()

    f = open('{}.extensions.conf'.format(kn), 'w')
    f.write("""basicConstraints=CA:FALSE
subjectAltName=@my_subject_alt_names
subjectKeyIdentifier = hash

[ my_subject_alt_names ]
""")
    for i, name in enumerate(args.alias):
        f.write("DNS.{} = {}\n".format(i+1, name))
    f.close()

    ret = subprocess.Popen(['openssl', 'genrsa', '-out', '{}.key'.format(kn), '2048']).wait()
    ret = subprocess.Popen(['openssl', 'req', '-new', '-key', '{}.key'.format(kn), '-out', '{}.csr'.format(kn), '-sha256', '-config', '{}.conf'.format(kn)]).wait()
    ret = subprocess.Popen(['openssl', 'ca', '-config', 'ca.conf', '-out', '{}.crt'.format(kn), '-extfile', '{}.extensions.conf'.format(kn), '-in', '{}.csr'.format(kn)]).wait()

if '__main__' == __name__:
    main()

