function [X,ndx,dbg] = natsort(X,xpr,varargin) %#ok<*SPERR>
% Natural-order sort of a cell array of strings, with customizable numeric format.
%
% (c) 2014 Stephen Cobeldick
%
% ### Function ###
%
% Sort a cell array of strings by both character order and the values of
% any numeric substrings that occur within the strings. The default sort is
% case-insensitive ascending with integer numeric substrings: optional
% inputs control the sort direction, case sensitivity, and the numeric
% substring matching (see 'Numeric Substrings' below).
%
% Syntax:
%   Y = natsort(X)
%  [Y,ndx] = natsort(X,...);
%  [...] = natsort(X,xpr)
%  [...] = natsort(X,xpr,<options>)
%
% To sort filenames/fullpaths correctly use "natsortfiles" (File Exchange 47434).
% To sort the rows of a cell array of strings use "natsortrows" (File Exchange 47433).
%
% See also NATSORTFILES NATSORTROWS SORTROWS SORT CELLSTR REGEXP SSCANF NUM2ORDINAL NUM2WORDS INTMAX
%
% ### Numeric Substrings ###
%
% Numeric substrings consist of some combination of digits, and may optionally
% include a +/- sign, decimal point, exponent, etc. The numeric substrings
% are specified by the optional "regexp" pattern <xpr>: matching substrings
% are then parsed by "sscanf" (*default format '%f') into their numeric values.
% Note that '%b' is not a standard "sscanf" format, and is parsed internally.
%
% All other characters not matching the "regexp" pattern <xpr> are treated
% as individual characters (letters), and are sorted by ASCII character order.
%
% <xpr>       | Numeric Substring| Numeric Substring             | "sscanf"
% Examples:   | Match Examples:  | Match Description:            | Format:
% ============|==================|===============================|=============
% *       \d+ | 0, 1, 234, 56789 | integer                       | %f/%u/%lu/%i
% ------------|------------------|-------------------------------|-------------
%   (-|+)?\d+ | -1, 23, +45, 678 | integer with optional +/- sign| %f/%d/%ld/%i
% ------------|------------------|-------------------------------|-------------
% \d+(\.\d+)? | 012, 3.45, 678.9 | integer or decimal            | %f
% ------------|------------------|-------------------------------|-------------
% \d+|Inf|NaN | 123456, Inf, NaN | integer, infinite or NaN value| %f
% ------------|------------------|-------------------------------|-------------
% \d+\.\d+e\d+| 0.123e4, 5.67e08 | exponential notation          | %f
% ------------|------------------|-------------------------------|-------------
% 0X[0-9A-F]+ | 0X0, 0XFF, 0X7C4 | hexadecimal notation & prefix | %x/%i
% ------------|------------------|-------------------------------|-------------
% 0B[01]+     | 0B101, 0B0010111 | binary notation & prefix      | %b
% ------------|------------------|-------------------------------|-------------
%
% All "sscanf" formats (including %b) can include literal characters, field
% widths and skipped fields. The hexadecimal and binary prefixes are optional.
%
% ### Relative Sort Order ###
%
% The sort order of the numeric substrings relative to the character
% encoding values can be controlled using an <options> string token.
%
% Option Token:| Relative Sort Order:                 | Example:
% =============|======================================|====================
% 'beforechar' | numerics < char(0:end)               | '1' < '.' < 'A'
% -------------|--------------------------------------|--------------------
% 'afterchar'  | char(0:end) < numerics               | '.' < 'A' < '1'
% -------------|--------------------------------------|--------------------
% 'asdigit'   *| char(0:47) < numerics < char(58:end) | '.' < '1' < 'A'
% -------------|--------------------------------------|--------------------
%
% ### Examples ###
%
% % Integer numeric substrings:
% A = {'name_2','name_','name_10','name_1'};
% sort(A)
% ans = {'name_','name_1','name_10','name_2'}
% natsort(A)
% ans = {'name_','name_1','name_2','name_10'}
%
% % Multiple numeric substrings (e.g. version numbers):
% B = {'v10.6','vX','v10.10','','v2.10','v2.6','v','v2.10.20','v2.10.8'};
% sort(B)
% ans = {'','v','v10.10','v10.6','v2.10','v2.10.20','v2.10.8','v2.6','vX'}
% natsort(B)
% ans = {'','v','v2.6','v2.10','v2.10.8','v2.10.20','v10.6','v10.10','vX'}
%
% % Integer, decimal or Inf numeric substrings, possibly with +/- signs:
% C = {'test102','test11.5','test-1.4','test','test-Inf','test+0.3'};
% sort(C)
% ans = {'test','test+0.3','test-1.4','test-Inf','test102','test11.5'}
% natsort(C, '(-|+)?(Inf|\d+(\.\d+)?)')
% ans = {'test','test-Inf','test-1.4','test+0.3','test11.5','test102'}
%
% % Integer or decimal numeric substrings, possibly with an exponent:
% D = {'0.56e007','4.3E-2','10000','9.8',''};
% sort(D)
% ans = {'','0.56e007','10000','4.3E-2','9.8'}
% natsort(D, '\d+(\.\d+)?(e(+|-)?\d+)?')
% ans = {'','4.3E-2','9.8','10000','0.56e007'}
%
% % Hexadecimal numeric substrings (optional '0X' prefix):
% E = {'a0X7C4z','a0X5z','a0X18z','aFz'};
% sort(E)
% ans = {'a0X18z','a0X5z','a0X7C4z','aFz'}
% natsort(E, '(?<=a)(0X)?[0-9A-F]+', '%x')
% ans = {'a0X5z','aFz','a0X18z','a0X7C4z'}
%
% % Binary numeric substrings (optional '0B' prefix):
% F = {'a0B011111000100z','a0B101z','a0B000000010010z','a1111z'};
% sort(F)
% ans = {'a0B000000010010z','a0B011111000100z','a0B101z','a1111z'}
% natsort(F, '(0B)?[01]+', '%b')
% ans = {'a0B101z','a1111z','a0B000000010010z','a0B011111000100z'}
%
% % uint64 numeric substrings (see "uint64" and "maxint"):
% natsort({'a18446744073709551615z','a18446744073709551614z'}, '\d+', '%lu')
% ans =  {'a18446744073709551614z','a18446744073709551615z'}
%
% % Case sensitivity:
% G = {'a2','A20','A1','a10','A2','a1'};
% natsort(G, '\d+', 'matchcase')
% ans =  {'A1'    'A2'    'A20'    'a1'    'a2'    'a10'}
% natsort(G, '\d+', 'ignorecase')
% ans =  {'A1'    'a1'    'a2'    'A2'    'a10'    'A20'}
%
% % Sort direction:
% H = {'2','a','3','B','1'};
% natsort(H, '\d+', 'ascend')
% ans =  {'1','2','3','a','B'}
% natsort(H, '\d+', 'descend')
% ans =  {'B','a','3','2','1'}
%
% % Relative sort-order of numeric substrings compared to characters:
% X = cellstr(char(32+randperm(63)).');
% Y = natsort(X, '\d+', 'beforechar'); [Y{:}]
% ans = '0123456789!"#$%&'()*+,-./:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\]^_'
% Y = natsort(X, '\d+', 'afterchar'); [Y{:}]
% ans = '!"#$%&'()*+,-./:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\]^_0123456789'
% Y = natsort(X, '\d+', 'asdigit'); [Y{:}]
% ans = '!"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\]^_'
%
% ### Input and Output Arguments ###
%
% Inputs (*=default):
%   X   = CellOfStrings, with strings to be sorted into natural-order.
%   xpr = StringToken, regular expression to detect numeric substrings, '\d+'*.
% <options> string tokens can be entered in any order, as many as required:
%   - Case sensitive/insensitive: 'matchcase'/'ignorecase'*.
%   - Sort direction: 'descend'/'ascend'*.
%   - Relative sort of numerics 'beforechar'/'afterchar'/'asdigit'*.
%   - The "sscanf" numeric conversion format, e.g.: '%b', '%x', '%i', '%f'*.
%
% Outputs:
%   Y   = CellOfStrings, <X> with all strings sorted into natural-order.
%   ndx = NumericArray, such that Y = X(ndx). The same size as <X>.
%   dbg = CellArray of all parsed characters and numeric values. Each row is
%         one string, linear-indexed from <X>. Helps to debug string parsing.
%
% [X,ndx,dbg] = natsort(X,*xpr,<options>)

% ### Input Wrangling ###
%
assert(iscellstr(X),'First input <X> must be a cell array of strings.')
%
% Regular expression:
if nargin<2
    xpr = '\d+';
else
    assert(ischar(xpr)&&isrow(xpr),'Second input <xpr> must be a string regular expression.')
end
%
% Optional arguments:
assert(iscellstr(varargin),'All optional arguments must be string tokens.')
% Character case matching:
MatL = strcmp(varargin,'matchcase');
CasL = strcmp(varargin,'ignorecase')|MatL;
% Sort direction:
DcdL = strcmp(varargin,'descend');
DrnL = strcmp(varargin,'ascend')|DcdL;
% Relative sort-order of numerics compared to characters:
BefL = strcmp(varargin,'beforechar');
AftL = strcmp(varargin,'afterchar');
RsoL = strcmp(varargin,'asdigit')|BefL|AftL;
% "sscanf" conversion format:
FmtL = ~(CasL|DrnL|RsoL);
%
% ### Split Strings ###
%
% Split strings into numeric and remaining substrings:
[MtS,MtE,MtC,SpC] = regexpi(X(:),xpr,'start','end','match','split',varargin{CasL});
%
% Determine lengths:
MtcD = cellfun(@minus,MtE,MtS,'UniformOutput',false);
LenZ = cellfun('length',X(:))-cellfun(@sum,MtcD);
LenY = max(LenZ);
LenX = numel(MtC);
%
dbg = cell(LenX,LenY);
NuI = false(LenX,LenY);
ChI = false(LenX,LenY);
ChA = char(+ChI);
%
ndx = 1:LenX;
for k = ndx(LenZ>0)
    % Determine indices of numerics and characters:
    ChI(k,1:LenZ(k)) = true;
    if ~isempty(MtS{k})
        tmp = MtE{k} - cumsum(MtcD{k});
        dbg(k,tmp) = MtC{k};
        NuI(k,tmp) = true;
        ChI(k,tmp) = false;
    end
    % Transfer characters into char array:
    if any(ChI(k,:))
        tmp = SpC{k};
        ChA(k,ChI(k,:)) = [tmp{:}];
    end
end
%
% ### Convert Numeric Substrings ###
%
% Substrings into a numeric array:
switch sum(FmtL)
    case 0
        NuA(NuI) = sscanf(sprintf('%s\v',dbg{NuI}),'%f\v');
    case 1
        fmt = varargin{FmtL};
        if isscalar(regexp(fmt,'%\d*(d|i|u|o|x|f|e|g)'))% parse into double
            NuA(NuI) = sscanf(sprintf('%s\v',dbg{NuI}),[fmt,'\v']); % fast!
        elseif isscalar(regexp(fmt,'%\d*l(d|i|u|o|x)'))% parse into int64 or uint64.
            NuA(NuI) = cellfun(@(s)sscanf(s,fmt),dbg(NuI)); %slow!
        elseif isscalar(regexp(fmt,'%\d*b'))% homemade binary conversion.
            fmt = regexprep(fmt,'%(\d*)b','%$1[01]'); % allow for literals.
            val = regexprep(dbg(NuI),'(0B)?([01]+)','$2','ignorecase');
            val = char(cellfun(@(s)sscanf(s,fmt),val,'UniformOutput',false))-'0';
            pwr = fix(pow2(bsxfun(@minus,size(val,2)-1:-1:0,sum(val<0,2))));
            NuA(NuI) = sum(val.*pwr,2);
        else
            error('Unsupported optional argument: ''%s''',fmt)
        end
    otherwise
        error('Unsupported optional arguments:%s\b.',sprintf(' ''%s'',',varargin{FmtL}))
end
% Note: NuA's class is determined by "sscanf".
NuA(~NuI) = 0;
NuA = reshape(NuA,LenX,LenY);
%
% ### Debugging Array ###
%
if nargout>2
    for k = reshape(find(NuI),1,[])
        dbg{k} = NuA(k);
    end
    for k = reshape(find(ChI),1,[])
        dbg{k} = ChA(k);
    end
end
%
% ### Sort ###
%
if sum(DrnL)>1
    error('Sort direction is overspecified:%s\b.',sprintf(' ''%s'',',varargin{DrnL}))
end
%
if sum(RsoL)>1
    error('Relative sort-order is overspecified:%s\b.',sprintf(' ''%s'',',varargin{RsoL}))
end
%
if ~any(MatL)% ignorecase
    ChA = upper(ChA);
end
%
bel = any(BefL);
afl = any(AftL);
dcl = any(DcdL);
%
ide = ndx.';
% From the last column to the first...
for n = LenY:-1:1
    % ...sort the characters and numeric values:
    [C,idc] = sort(ChA(ndx,n),1,varargin{DrnL});
    [~,idn] = sort(NuA(ndx,n),1,varargin{DrnL});
    % ...keep only relevant indices:
    jdc = ChI(ndx(idc),n);
    jdn = NuI(ndx(idn),n);
    jde = ~ChI(ndx,n)&~NuI(ndx,n);
    % ...define the sort-order of numerics and characters:
    jdo = afl|(~bel&C<48);
    % ...then combine these indices in the requested direction:
    if dcl
        ndx = ndx([idc(jdc&~jdo);idn(jdn);idc(jdc&jdo);ide(jde)]);
    else
        ndx = ndx([ide(jde);idc(jdc&jdo);idn(jdn);idc(jdc&~jdo)]);
    end
end
%
ndx  = reshape(ndx,size(X));
X = X(ndx);
%
end
%----------------------------------------------------------------------END:natsort