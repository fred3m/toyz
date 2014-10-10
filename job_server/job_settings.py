import sys

from ..utils import core
# add any other source directories to be added to the python path here
other_src_dirs=[]
for myDir in other_src_dirs:
    sys.path.insert(0,myDir)

# Since I don't have root access to etacha, the following line is used to point to the directory
# I have installed python scripts
if '/media/data-beta/' in core.ROOT_DIR:
    sys.path.insert(0,'/media/data-beta/users/fmooleka/python_home/lib/python')