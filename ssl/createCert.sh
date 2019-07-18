#!/bin/sh

org="$1"
shift
kn=`echo $org | tr 'A-Z ' 'a-z_'`
dn="$1"
shift

openssl genrsa -out $kn.key 2048

cat > $kn.conf <<HERE
# The main section is named req because the command we are using is req
# (openssl req ...)
[ req ]
# This specifies the default key size in bits. If not specified then 512 is
# used. It is used if the -new option is used. It can be overridden by using
# the -newkey option. 
default_bits = 2048

# This is the default filename to write a private key to. If not specified the
# key is written to standard output. This can be overridden by the -keyout
# option.
default_keyfile = $kn.key

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
C = US
ST = California
L = Monrovia
O  = $org
CN = $dn

[ my_extensions ]
basicConstraints=CA:FALSE
subjectAltName=@my_subject_alt_names
subjectKeyIdentifier = hash

[ my_subject_alt_names ]
HERE
i=1
for san in $@ ; do
    echo "DNS.$i = $san" >> $kn.conf
    i=$(($i+1))
done

cat >$kn.extensions.conf <<HERE
basicConstraints=CA:FALSE
subjectAltName=@my_subject_alt_names
subjectKeyIdentifier = hash

[ my_subject_alt_names ]
HERE
i=1
for san in $@ ; do
    echo "DNS.$i = $san" >> $kn.extensions.conf
    i=$(($i+1))
done

openssl req -new -key $kn.key -out $kn.csr -sha256 -config $kn.conf
openssl ca -config ca.conf -out $kn.crt -extfile $kn.extensions.conf -in $kn.csr
