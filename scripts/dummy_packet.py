import hashlib
import hmac
import socket
import struct
import time

server_addr = ("127.0.0.1", 5000)
reader_id = 1
# Pair with the real reader and get the secret from it's config json
secret = b"441f2f5d3527"
uid = b"\xca\xfe\xba\xbe"
magic = 0xAA
uid_len = len(uid)
timestamp = int(time.time())
seq = 1

mac = hmac.new(secret, digestmod=hashlib.sha256)
mac.update(struct.pack(">BBqIH", magic, uid_len, timestamp, seq, reader_id))
mac.update(uid)
h_digest = mac.digest()

header = struct.pack(">BBqIH", magic, uid_len, timestamp, seq, reader_id)
packet = header + h_digest + uid

with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
    s.connect(server_addr)
    s.sendall(packet)
    response = s.recv(1)
    if response:
        print(f"ack received: 0x{response[0]:02X}")
