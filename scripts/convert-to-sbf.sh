#!/bin/bash
# Convert raw puzzle data to SBF format
# Usage: ./scripts/convert-to-sbf.sh input.txt > output.sbf
#
# Input format: rows,cols,stars,"REGIONS","SOLUTION" # comment
# Output format: {size}x{stars}.{regions_base36}

input="${1:-/dev/stdin}"
while IFS= read -r line; do
  # Skip comments and empty lines
  [[ "$line" =~ ^#.*$ || -z "$line" ]] && continue

  # Extract: rows,cols,stars,"REGIONS","SOLUTION" # comment
  if [[ "$line" =~ ^([0-9]+),([0-9]+),([0-9]+),\"([A-Z]+)\" ]]; then
    rows="${BASH_REMATCH[1]}"
    stars="${BASH_REMATCH[3]}"
    regions="${BASH_REMATCH[4]}"

    # Convert uppercase letters to base36 (A→0, B→1, ... Z→p)
    regions_lower=$(echo "$regions" | tr 'A-Z' '0-9a-p')

    echo "${rows}x${stars}.${regions_lower}"
  fi
done < "$input"
