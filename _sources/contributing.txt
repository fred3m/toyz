.. _contributing:

********************
Contributing to Toyz
********************

Toyz still has a long way to go and undoubtably numerous bugs that I have yet to discover.
I'm open to having as many people work on Toyz as possible but ask that you follow a few
guidelines.

    1. If you're making a big change (like adding or significantly expanding a feature),
       please visit the `Google group <https://groups.google.com/forum/#!forum/toyz-dev>`_
       to make sure that no one else is working on it or that it conflicts with another
       planned feature in some way
    2. Try to comment the code as least as well as it's currently commented, especially the
       python code. I've been a bit more liberal with my js code and that will change 
       in the future, but since most users will be python users I want to try to keep that
       portion of the framework neat and tidy.
    3. Follow the `PEP 8 <https://www.python.org/dev/peps/pep-0008/>`_ style guide, with
       the noted exception that Toyz uses 99 character widths (as opposed to the more
       canonical 79, since the code contains a lot of JSON objects and dictionaries)
    4. Don't use C/C++ code unless it's absolutely necessary for speed. Usually some
       combination of numpy, scipy, and pandas can accomplish the same task in nearly the
       same running time but greatly simplify the installation process