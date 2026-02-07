#!/bin/bash
# Convert raw puzzle data to SBN format
# Usage: ./scripts/convert-to-sbn.sh input.txt > output.sbn
#
# Input format: rows,cols,stars,"REGIONS","SOLUTION" # comment
# Output format: {size}x{stars}.{REGIONS}

input="${1:-/dev/stdin}"
while IFS= read -r line; do
  # Skip comments and empty lines
  [[ "$line" =~ ^#.*$ || -z "$line" ]] && continue

  # Extract: rows,cols,stars,"REGIONS","SOLUTION" # comment
  if [[ "$line" =~ ^([0-9]+),([0-9]+),([0-9]+),\"([A-Z]+)\" ]]; then
    rows="${BASH_REMATCH[1]}"
    stars="${BASH_REMATCH[3]}"
    regions="${BASH_REMATCH[4]}"

    echo "${rows}x${stars}.${regions}"
  fi
done < "$input"
