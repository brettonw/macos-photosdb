#! /usr/bin/env perl

use strict;
use warnings;

use File::Find;
use File::Path  qw(make_path remove_tree);
use File::Copy;

my ($mastersDir, $thumbnailsDir) = @ARGV;

$File::Find::follow = 1;
my %options = (
    wanted => \&wanted,
    follow            => 1,
    follow_skip       => 2
);

find(\%options, $mastersDir);

sub wanted {
    my $fileName = $File::Find::name;
    my $thumbnailName = $fileName;
    $thumbnailName =~ s/$mastersDir/$thumbnailsDir/;
    $thumbnailName =~ s/\.[^\.]*$//;
    $thumbnailName = "$thumbnailName.jpg";
    my $thumbnailPath = $thumbnailName;
    $thumbnailPath =~ s/[^\/]+$//;

    # create the thumbnail path if it doesn't alredy exist
    if (!(-d "$thumbnailPath")) {
        print STDERR "$fileName -> $thumbnailPath\n";
        make_path ($thumbnailPath);
    }

    # check to see if there is a thumbnail, if not, make one
    if (!(-e "$thumbnailName")) {
        if ($fileName =~ /\.jpg/i) {
            copy ("$fileName", "$thumbnailName");
            print STDERR "Creating thumbnail ($thumbnailName)\n";
            `sips --resampleHeight 128 "$thumbnailName"`;
            `chmod ugo+r "$thumbnailName"`;
        }
    }
}
