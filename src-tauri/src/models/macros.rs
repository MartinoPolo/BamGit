/// Generates `as_str()`, `FromSql`, and `ToSql` implementations for a string-backed enum.
///
/// Usage:
/// ```ignore
/// impl_sql_enum!(MyEnum {
///     VariantA => "variant-a",
///     VariantB => "variant-b",
/// });
/// ```
macro_rules! impl_sql_enum {
    ($enum_name:ident { $($variant:ident => $str_value:literal),+ $(,)? }) => {
        impl $enum_name {
            pub fn as_str(&self) -> &'static str {
                match self {
                    $($enum_name::$variant => $str_value),+
                }
            }
        }

        impl ::rusqlite::types::FromSql for $enum_name {
            fn column_result(
                value: ::rusqlite::types::ValueRef<'_>,
            ) -> ::rusqlite::types::FromSqlResult<Self> {
                let text = value.as_str()?;
                match text {
                    $($str_value => Ok($enum_name::$variant)),+,
                    other => Err(::rusqlite::types::FromSqlError::Other(
                        format!("Unknown {}: {other}", stringify!($enum_name)).into(),
                    )),
                }
            }
        }

        impl ::rusqlite::types::ToSql for $enum_name {
            fn to_sql(&self) -> ::rusqlite::Result<::rusqlite::types::ToSqlOutput<'_>> {
                Ok(::rusqlite::types::ToSqlOutput::from(self.as_str()))
            }
        }
    };
}
