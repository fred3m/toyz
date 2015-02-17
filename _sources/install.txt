.. _install:

*******
Install
*******

Requirements
============
- `Python <https://www.python.org/>`_ 2.7 or later
- `Tornado <http://www.tornadoweb.org/en/stable/>`_ 4.0 or later
- `passlib <https://pythonhosted.org/passlib/>`_ 1.6.2 or later (eventually this will be optional 
  and only required for password protected toyz applications)

Optional Requirements
=====================
- `numpy <http://www.numpy.org/>`_ 1.5.1 or later
    + Required to load saved .npy files
- `pil <http://www.pythonware.com/products/pil/>`_ or 
  `pillow <https://pillow.readthedocs.org/>`_ 2.7.0 or later
    + Required to view images in workspaces
- `Highcharts <http://www.highcharts.com/download>`_ 4.0 or higher
    + Required for interactive plots and charts
    + Software contains link to online resource but can also be downloaded from
      `http://www.highcharts.com/download`_
    + is free for personal or non-profit use and 
      `reasonably priced <http://shop.highsoft.com/highcharts.html>`_ for commercial use

Installing Toyz
===============
The Toyz framework only needs to be installed on the machine acting as the server. This can be 
a local machine, remote server, or even remote super-computer (we are working on testing this
on a blue-gene super computer at the University of Rochester at this time).


Using pip
---------
Toyz is registered in the `Python Package Index (pypi) <https://pypi.python.org/pypi>`_ and 
within the next few weeks version 0.0 will be added.

Installing from source
----------------------

Obtaining the source code
^^^^^^^^^^^^^^^^^^^^^^^^^
Download the source code `here <https://github.com/fred3m/toyz>`_ on github, or by typing::

    git clone git://github.com/fred3m/toyz.git

Installing
^^^^^^^^^^
To install Toyz from the source code navigate to the root directory of the source code and type::

    python setup.py install

.. note:: 

    On unix systems you may be required to prepend '*sudo*' to your install command::

        sudo python setup.py install

As this is a new package, please let me know any problems you have had installing the source code
so I can fix them or share steps needed to resolve them with other users. For bugs, please
create an `issue <https://github.com/fred3m/toyz/issues>`_ on github. For other comments or
suggestions please create a post on our 
`Google group <https://groups.google.com/forum/#!forum/toyz-dev>`_