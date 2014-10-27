import os
import base64
import uuid
from passlib.context import CryptContext

web_settings = {
    'port': 8888,
    'cookie_secret': base64.b64encode(uuid.uuid4().bytes + uuid.uuid4().bytes),
    'default_user': 'admin'
}

db_settings = {
    'name': 'toyz.db',
    'db_type': 'sqlite'
    'interface_name': 'sqlite_interface'
}

# Password cryptography settings
pwd_context = CryptContext(
    schemes = ['sha512_crypt','pbkdf2_sha512'],
    default = "sha512_crypt",
    sha512_crypt__default_rounds = 500000,
    pbkdf2_sha512__default_rounds = 100000,
    all__vary_rounds = 0.1      # vary rounds parameter randomly when creating new hashes...
)

#port = 8888
#cookie_secret = "2r#BA?Jjp.[pz;X}K>Z)V}X'cspe@kdf/[=3NC.CFM+8k&pQx0Z&'U=Sg&.J+.1A"



#GUEST_ENABLED = False
#USER_LOGIN = True
#USER_TABLE = os.path.join(core.ROOT_DIR,'data','users.tbl')
#GROUPS_TABLE = os.path.join(core.ROOT_DIR,'data','groups.tbl')
#USER_SETTINGS = os.path.join(core.ROOT_DIR,'data','user_settings.tbl')
#USE_DATABASE=False